begin;

create schema if not exists wally_private;
revoke all on schema wally_private from public;
grant usage on schema wally_private to authenticated;

create table public.currencies (
  code text primary key check (code ~ '^[A-Z]{3}$'),
  name text not null,
  minor_units smallint not null check (minor_units between 0 and 4)
);
insert into public.currencies values ('PEN', 'Sol peruano', 2);

create table public.payment_methods (
  id text primary key,
  name text not null
);
insert into public.payment_methods values
  ('debit', 'Tarjeta de débito'), ('credit', 'Tarjeta de crédito'),
  ('cash', 'Efectivo'), ('transfer', 'Transferencia');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Usuario de Wally' check (char_length(display_name) between 1 and 100),
  created_at timestamptz not null default now()
);

create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  kind text not null check (kind in ('personal', 'shared')),
  currency_code text not null default 'PEN' references public.currencies(code),
  created_at timestamptz not null default now()
);
create unique index one_personal_wallet_per_user on public.wallets(owner_id) where kind = 'personal';
create index wallets_owner on public.wallets(owner_id);

-- Ownership lives only in wallets; this table contains the other members.
create table public.wallet_members (
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (wallet_id, user_id)
);
create index wallet_members_user on public.wallet_members(user_id, wallet_id);

create table public.categories (
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  id text not null default gen_random_uuid()::text check (char_length(id) between 1 and 80),
  type text not null check (type in ('income', 'expense')),
  label text not null check (char_length(btrim(label)) between 1 and 40),
  emoji text not null default '🏷️' check (char_length(emoji) between 1 and 16),
  color text not null default '#79bea8' check (color ~ '^#[0-9a-fA-F]{6}$'),
  tone text not null default 'green' check (tone in ('orange','yellow','blue','purple','pink','green')),
  created_at timestamptz not null default now(),
  primary key (wallet_id, id),
  unique (wallet_id, id, type)
);
create unique index categories_unique_name on public.categories(wallet_id, type, lower(btrim(label)));

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  category_id text not null,
  type text not null check (type in ('income', 'expense')),
  amount_cents bigint not null check (amount_cents between 1 and 99999999999),
  description text not null check (char_length(btrim(description)) between 1 and 160),
  payment_method_id text not null references public.payment_methods(id),
  occurred_on date not null check (occurred_on >= date '1900-01-01'),
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1 check (version > 0),
  foreign key (wallet_id, category_id, type) references public.categories(wallet_id, id, type),
  check (type <> 'income' or payment_method_id in ('cash', 'transfer'))
);
create index transactions_wallet_date on public.transactions(wallet_id, occurred_on desc, created_at desc);
create index transactions_wallet_category on public.transactions(wallet_id, category_id, type);
create index transactions_creator on public.transactions(created_by);

create table public.wallet_invitations (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  token_hash bytea not null unique,
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);
create index wallet_invitations_wallet on public.wallet_invitations(wallet_id);

create function wally_private.wallet_role(p_wallet_id uuid)
returns text language sql stable security definer set search_path = '' as $$
  select case when w.owner_id = (select auth.uid()) then 'owner'
    when exists (select 1 from public.wallet_members m
      where m.wallet_id = w.id and m.user_id = (select auth.uid())) then 'member' end
  from public.wallets w where w.id = p_wallet_id;
$$;
revoke all on function wally_private.wallet_role(uuid) from public;
grant execute on function wally_private.wallet_role(uuid) to authenticated;

alter table public.currencies enable row level security;
alter table public.payment_methods enable row level security;
alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.wallet_members enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.wallet_invitations enable row level security;

create policy currencies_read on public.currencies for select to authenticated using (true);
create policy methods_read on public.payment_methods for select to authenticated using (true);
create policy own_profile on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy own_profile_update on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy wallets_read on public.wallets for select to authenticated using (wally_private.wallet_role(id) is not null);
create policy wallets_rename on public.wallets for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy members_read on public.wallet_members for select to authenticated using (wally_private.wallet_role(wallet_id) is not null);
create policy members_remove on public.wallet_members for delete to authenticated using (wally_private.wallet_role(wallet_id) = 'owner');
create policy categories_read on public.categories for select to authenticated using (wally_private.wallet_role(wallet_id) is not null);
create policy categories_add on public.categories for insert to authenticated with check (wally_private.wallet_role(wallet_id) is not null);
create policy transactions_read on public.transactions for select to authenticated using (wally_private.wallet_role(wallet_id) is not null);
create policy transactions_add on public.transactions for insert to authenticated with check (wally_private.wallet_role(wallet_id) is not null and created_by = (select auth.uid()));
create policy transactions_edit on public.transactions for update to authenticated using (wally_private.wallet_role(wallet_id) is not null) with check (wally_private.wallet_role(wallet_id) is not null);
create policy transactions_remove on public.transactions for delete to authenticated using (wally_private.wallet_role(wallet_id) is not null);
create policy invitations_read on public.wallet_invitations for select to authenticated using (wally_private.wallet_role(wallet_id) = 'owner');
create policy invitations_revoke on public.wallet_invitations for delete to authenticated using (wally_private.wallet_role(wallet_id) = 'owner');

-- Explicit grants: no anonymous data access or direct membership/owner changes.
revoke all on public.currencies, public.payment_methods, public.profiles, public.wallets,
  public.wallet_members, public.categories, public.transactions, public.wallet_invitations from anon, authenticated;
grant select on public.currencies, public.payment_methods, public.profiles, public.wallets,
  public.wallet_members, public.categories, public.transactions to authenticated;
grant update (display_name) on public.profiles to authenticated;
grant update (name) on public.wallets to authenticated;
grant delete on public.wallet_members to authenticated;
grant insert (wallet_id, id, type, label, emoji, color, tone) on public.categories to authenticated;
grant insert (id, wallet_id, category_id, type, amount_cents, description, payment_method_id, occurred_on) on public.transactions to authenticated;
grant update (category_id, type, amount_cents, description, payment_method_id, occurred_on) on public.transactions to authenticated;
grant delete on public.transactions to authenticated;
grant select (id, wallet_id, expires_at, accepted_at, created_at), delete on public.wallet_invitations to authenticated;

create function wally_private.seed_categories(p_wallet_id uuid)
returns void language sql security definer set search_path = '' as $$
  insert into public.categories (wallet_id,id,type,label,emoji,tone,color) values
    (p_wallet_id,'food','expense','Alimentación','🍔','orange','#ff7658'),
    (p_wallet_id,'transport','expense','Transporte','🚕','yellow','#f2bd60'),
    (p_wallet_id,'shopping','expense','Compras','🛒','blue','#89a9e6'),
    (p_wallet_id,'services','expense','Servicios','💡','yellow','#a597ce'),
    (p_wallet_id,'entertainment','expense','Entretenimiento','🎬','purple','#e8a0b1'),
    (p_wallet_id,'health','expense','Salud','💊','pink','#79bea8'),
    (p_wallet_id,'salary','income','Sueldo','💰','green','#27ac86'),
    (p_wallet_id,'freelance','income','Honorarios','💼','green','#80c5af'),
    (p_wallet_id,'sales','income','Ventas','🛍️','blue','#89a9e6'),
    (p_wallet_id,'investments','income','Inversiones','🌱','green','#7fb392'),
    (p_wallet_id,'gifts','income','Regalos','🎁','purple','#a597ce'),
    (p_wallet_id,'other','income','Otros ingresos','✨','yellow','#f2bd60');
$$;
revoke all on function wally_private.seed_categories(uuid) from public;

create function wally_private.provision_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_wallet uuid;
begin
  insert into public.profiles (id, display_name) values
    (new.id, coalesce(nullif(left(btrim(new.raw_user_meta_data->>'full_name'),100),''),'Usuario de Wally'));
  insert into public.wallets (owner_id,name,kind) values (new.id,'Mi billetera','personal') returning id into v_wallet;
  perform wally_private.seed_categories(v_wallet);
  return new;
end;
$$;
revoke all on function wally_private.provision_user() from public;
create trigger wally_provision_user after insert on auth.users for each row execute function wally_private.provision_user();

-- Existing Auth users also get their personal wallet without changing identities.
insert into public.profiles (id, display_name)
select id, coalesce(nullif(left(btrim(raw_user_meta_data->>'full_name'),100),''),'Usuario de Wally') from auth.users;
insert into public.wallets (owner_id,name,kind) select id,'Mi billetera','personal' from public.profiles;
do $$ declare w record; begin
  for w in select id from public.wallets loop perform wally_private.seed_categories(w.id); end loop;
end $$;

create function wally_private.validate_transaction()
returns trigger language plpgsql set search_path = '' as $$
begin
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
revoke all on function wally_private.validate_transaction() from public;
create trigger validate_transaction before insert or update on public.transactions
  for each row execute function wally_private.validate_transaction();

create function public.create_shared_wallet(p_name text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_wallet uuid;
begin
  if auth.uid() is null then raise exception 'Inicia sesión para continuar.' using errcode = '42501'; end if;
  insert into public.wallets (owner_id,name,kind) values (auth.uid(),btrim(p_name),'shared') returning id into v_wallet;
  perform wally_private.seed_categories(v_wallet);
  return v_wallet;
end;
$$;

create function public.create_wallet_invitation(p_wallet_id uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare v_token text;
begin
  if wally_private.wallet_role(p_wallet_id) is distinct from 'owner'
    or not exists(select 1 from public.wallets where id=p_wallet_id and kind='shared') then
    raise exception 'Solo el propietario puede invitar a esta billetera compartida.' using errcode = '42501';
  end if;
  v_token := replace(gen_random_uuid()::text || gen_random_uuid()::text,'-','');
  insert into public.wallet_invitations (wallet_id,token_hash)
    values (p_wallet_id,sha256(convert_to(v_token,'UTF8')));
  return v_token;
end;
$$;

create function public.accept_wallet_invitation(p_token text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_inv public.wallet_invitations;
begin
  if auth.uid() is null then raise exception 'Inicia sesión para continuar.' using errcode = '42501'; end if;
  select * into v_inv from public.wallet_invitations
    where token_hash = sha256(convert_to(btrim(p_token),'UTF8')) for update;
  if not found or v_inv.accepted_at is not null or v_inv.expires_at <= now() then
    raise exception 'La invitación no es válida, ya se usó o venció.' using errcode = '22023';
  end if;
  if wally_private.wallet_role(v_inv.wallet_id) is not null then return v_inv.wallet_id; end if;
  insert into public.wallet_members (wallet_id,user_id) values (v_inv.wallet_id,auth.uid());
  update public.wallet_invitations set accepted_at=now() where id=v_inv.id;
  return v_inv.wallet_id;
end;
$$;

create function public.list_wallet_members(p_wallet_id uuid)
returns table (user_id uuid, display_name text, role text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if wally_private.wallet_role(p_wallet_id) is null then
    raise exception 'No tienes acceso a esta billetera.' using errcode = '42501';
  end if;
  return query
    select p.id,p.display_name,'owner'::text from public.wallets w join public.profiles p on p.id=w.owner_id where w.id=p_wallet_id
    union all
    select p.id,p.display_name,'member'::text from public.wallet_members m join public.profiles p on p.id=m.user_id where m.wallet_id=p_wallet_id;
end;
$$;

-- One snapshot avoids REST pagination truncating balances and mixed category reads.
create function public.get_wallet(p_wallet_id uuid)
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare v_data jsonb;
begin
  select jsonb_build_object('wallet',to_jsonb(w),
    'categories',coalesce((select jsonb_agg(c order by c.created_at,c.id) from public.categories c where c.wallet_id=w.id),'[]'::jsonb),
    'transactions',coalesce((select jsonb_agg(t order by t.created_at desc,t.id) from public.transactions t where t.wallet_id=w.id),'[]'::jsonb))
  into v_data from public.wallets w where w.id=p_wallet_id;
  if v_data is null then raise exception 'No tienes acceso a esta billetera.' using errcode = '42501'; end if;
  return v_data;
end;
$$;

-- RLS applies inside this function. Locks + versions prevent silent lost edits.
create function public.mutate_transaction(p_wallet_id uuid, p_action text, p_transaction jsonb, p_expected_version integer default null)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_old public.transactions; v_new public.transactions; v_id uuid;
begin
  v_id := (p_transaction->>'id')::uuid;
  if p_action in ('update','remove') then
    select * into v_old from public.transactions where wallet_id=p_wallet_id and id=v_id for update;
    if not found then raise exception 'El movimiento ya no existe o no tienes acceso.' using errcode = '42501'; end if;
    if p_expected_version is null or v_old.version <> p_expected_version then
      raise exception 'Otra persona modificó este movimiento. Actualiza antes de continuar.' using errcode = '40001';
    end if;
  end if;
  if p_action in ('add','restore') then
    insert into public.transactions (id,wallet_id,category_id,type,amount_cents,description,payment_method_id,occurred_on)
    values (v_id,p_wallet_id,p_transaction->>'category',p_transaction->>'type',
      (p_transaction->>'amountCents')::bigint,p_transaction->>'description',p_transaction->>'paymentMethod',(p_transaction->>'date')::date)
    returning * into v_new;
  elsif p_action='update' then
    update public.transactions set category_id=p_transaction->>'category',type=p_transaction->>'type',
      amount_cents=(p_transaction->>'amountCents')::bigint,description=p_transaction->>'description',
      payment_method_id=p_transaction->>'paymentMethod',occurred_on=(p_transaction->>'date')::date
    where id=v_id and wallet_id=p_wallet_id returning * into v_new;
  elsif p_action='remove' then
    delete from public.transactions where id=v_id and wallet_id=p_wallet_id;
  else raise exception 'Operación no válida.' using errcode='22023';
  end if;
  return jsonb_build_object('previous',case when v_old.id is null then null else to_jsonb(v_old) end,
    'transaction',case when v_new.id is null then null else to_jsonb(v_new) end);
end;
$$;

revoke all on function public.create_shared_wallet(text), public.create_wallet_invitation(uuid),
  public.accept_wallet_invitation(text), public.list_wallet_members(uuid), public.get_wallet(uuid),
  public.mutate_transaction(uuid,text,jsonb,integer) from public, anon;
grant execute on function public.create_shared_wallet(text), public.create_wallet_invitation(uuid),
  public.accept_wallet_invitation(text), public.list_wallet_members(uuid), public.get_wallet(uuid),
  public.mutate_transaction(uuid,text,jsonb,integer) to authenticated;

commit;
