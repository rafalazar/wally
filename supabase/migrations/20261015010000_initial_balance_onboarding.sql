begin;

alter table public.profiles
  add column onboarding_completed_at timestamptz,
  -- Deliberately not a foreign key: deleting the movement must not reopen onboarding.
  add column initial_transaction_id uuid unique,
  add column initial_transaction_version integer not null default 0 check (initial_transaction_version >= 0),
  add constraint initial_transaction_requires_completion
    check (initial_transaction_id is null or onboarding_completed_at is not null);

-- Only identities created after this migration will need the welcome screen.
update public.profiles set onboarding_completed_at = now();

alter table public.transactions
  alter column payment_method_id drop not null,
  add constraint transaction_initial_balance_method check (
    (category_id = 'opening_balance' and type = 'income' and payment_method_id is null)
    or (category_id <> 'opening_balance' and payment_method_id is not null)
  );
create unique index one_initial_balance_per_wallet on public.transactions(wallet_id)
  where category_id = 'opening_balance';

create function wally_private.validate_initial_category()
returns trigger language plpgsql set search_path = '' as $$
begin
  if (new.id = 'opening_balance' or lower(btrim(new.label)) = 'saldo inicial') and not exists (
    select 1 from public.wallets w join public.profiles p on p.id = w.owner_id
    where w.id = new.wallet_id and w.kind = 'personal' and w.owner_id = auth.uid()
      and p.initial_transaction_id is not null and p.onboarding_completed_at is not null
      and new.id = 'opening_balance' and new.type = 'income' and new.label = 'Saldo inicial'
  ) then
    raise exception 'La categoría Saldo inicial está reservada para la bienvenida.' using errcode = '22023';
  end if;
  return new;
end;
$$;
revoke all on function wally_private.validate_initial_category() from public;
create trigger validate_initial_category before insert or update on public.categories
  for each row execute function wally_private.validate_initial_category();

create or replace function wally_private.validate_transaction()
returns trigger language plpgsql set search_path = '' as $$
declare v_initial uuid; v_completed timestamptz; v_kind text; v_owner uuid;
begin
  select p.initial_transaction_id, p.onboarding_completed_at, w.kind, w.owner_id
    into v_initial, v_completed, v_kind, v_owner
    from public.wallets w left join public.profiles p on p.id = w.owner_id
    where w.id = new.wallet_id;

  if v_kind = 'personal' and v_completed is null then
    raise exception 'Completa tu saldo inicial antes de registrar movimientos.' using errcode = '22023';
  end if;
  if new.category_id = 'opening_balance' or new.id = v_initial
    or (tg_op = 'UPDATE' and old.category_id = 'opening_balance') then
    if v_kind is distinct from 'personal' or v_owner is distinct from auth.uid()
      or new.id is distinct from v_initial or new.category_id <> 'opening_balance'
      or new.type <> 'income' or new.payment_method_id is not null then
      raise exception 'El saldo inicial conserva su identidad, categoría y tipo de ingreso, sin método de pago.' using errcode = '22023';
    end if;
  end if;
  if new.occurred_on > (now() at time zone 'America/Lima')::date then
    raise exception 'La fecha debe ser hasta el día de hoy.' using errcode = '22023';
  end if;
  new.description := btrim(new.description);
  if tg_op = 'UPDATE' then
    new.version := old.version + 1;
    new.updated_at := clock_timestamp();
  end if;
  return new;
end;
$$;

-- Keep version checks meaningful when undo restores the same opening-balance ID.
create function wally_private.advance_initial_balance_version()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.category_id = 'opening_balance' then
    update public.profiles p set initial_transaction_version = p.initial_transaction_version + 1
      from public.wallets w where p.id = auth.uid() and w.owner_id = p.id
        and w.kind = 'personal' and w.id = new.wallet_id and p.initial_transaction_id = new.id
      returning p.initial_transaction_version into new.version;
    if not found then
      raise exception 'No tienes acceso a este saldo inicial.' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function wally_private.advance_initial_balance_version() from public;
-- PostgreSQL executes triggers alphabetically; validate first, then assign the durable version.
create trigger zz_initial_balance_version before insert or update on public.transactions
  for each row execute function wally_private.advance_initial_balance_version();

create function public.complete_onboarding(p_amount_cents bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_profile public.profiles; v_wallet uuid; v_initial uuid;
begin
  if auth.uid() is null then
    raise exception 'Inicia sesión para continuar.' using errcode = '42501';
  end if;
  select * into v_profile from public.profiles where id = auth.uid() for update;
  if not found then
    raise exception 'No encontramos tu perfil. Vuelve a iniciar sesión.' using errcode = '42501';
  end if;
  select id into v_wallet from public.wallets where owner_id = auth.uid() and kind = 'personal';
  if v_wallet is null then
    raise exception 'No encontramos tu billetera personal.' using errcode = '22023';
  end if;
  -- Retried requests return the original result, even if the movement was later deleted.
  if v_profile.onboarding_completed_at is not null then
    return jsonb_build_object('wallet_id', v_wallet, 'initial_transaction_id', v_profile.initial_transaction_id,
      'onboarding_completed_at', v_profile.onboarding_completed_at);
  end if;
  if p_amount_cents is null or p_amount_cents < 1 or p_amount_cents > 99999999999 then
    raise exception 'Ingresa un monto mayor a 0, con hasta 2 decimales.' using errcode = '22023';
  end if;
  v_initial := gen_random_uuid();
  update public.profiles set initial_transaction_id = v_initial, onboarding_completed_at = now()
    where id = auth.uid() returning * into v_profile;
  insert into public.categories(wallet_id, id, type, label, emoji, tone, color)
    values(v_wallet, 'opening_balance', 'income', 'Saldo inicial', '🌱', 'green', '#008563');
  insert into public.transactions(id, wallet_id, category_id, type, amount_cents, description, payment_method_id, occurred_on, created_by)
    values(v_initial, v_wallet, 'opening_balance', 'income', p_amount_cents, 'Saldo inicial', null,
      (now() at time zone 'America/Lima')::date, auth.uid());
  return jsonb_build_object('wallet_id', v_wallet, 'initial_transaction_id', v_initial,
    'onboarding_completed_at', v_profile.onboarding_completed_at);
end;
$$;
revoke all on function public.complete_onboarding(bigint) from public, anon;
grant execute on function public.complete_onboarding(bigint) to authenticated;

commit;
