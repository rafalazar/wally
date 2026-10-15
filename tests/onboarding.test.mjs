import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';

test('initial balance migration, atomic completion and access boundaries', async t => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth;
    create table auth.users (id uuid primary key, raw_user_meta_data jsonb default '{}'::jsonb);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
  `);
  const directory = new URL('../supabase/migrations/', import.meta.url);
  const files = (await readdir(directory)).filter(file => file.endsWith('.sql')).sort();
  const legacy = randomUUID();
  for (const file of files) {
    if (file.endsWith('_initial_balance_onboarding.sql')) await db.query('insert into auth.users(id) values ($1)', [legacy]);
    await db.exec(await readFile(new URL(file, directory), 'utf8'));
  }
  const user = async () => {
    const id = randomUUID();
    await db.query('insert into auth.users(id) values ($1)', [id]);
    const wallet = (await db.query('select id from public.wallets where owner_id=$1', [id])).rows[0].id;
    return { id, wallet };
  };
  const asUser = (id, action) => db.transaction(async tx => {
    await tx.exec(id ? 'set local role authenticated' : 'set local role anon');
    await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [id ?? '']);
    return action(tx);
  });
  const complete = (id, amount) => asUser(id, async tx =>
    (await tx.query('select public.complete_onboarding($1) as result', [amount])).rows[0].result);
  const profile = async id => (await db.query('select * from public.profiles where id=$1', [id])).rows[0];
  const entries = async wallet => (await db.query('select * from public.transactions where wallet_id=$1', [wallet])).rows;
  const mutate = (id, wallet, action, item, version = null) => asUser(id, async tx =>
    (await tx.query('select public.mutate_transaction($1,$2,$3::jsonb,$4) as result', [wallet, action, JSON.stringify(item), version])).rows[0].result);
  const draft = (overrides = {}) => ({ id: randomUUID(), type: 'income', category: 'opening_balance', amountCents: 50000,
    description: 'Saldo inicial', paymentMethod: null, date: '2026-01-01', ...overrides });

  await t.test('legacy accounts stay completed even with an empty wallet', async () => {
    assert.ok((await profile(legacy)).onboarding_completed_at);
    assert.equal((await profile(legacy)).initial_transaction_id, null);
    const result = await complete(legacy, 100);
    assert.equal(result.initial_transaction_id, null);
    assert.equal((await entries(result.wallet_id)).length, 0);
  });
  await t.test('new accounts must complete a positive initial amount and cannot forge profile state', async () => {
    const account = await user();
    assert.equal((await profile(account.id)).onboarding_completed_at, null);
    for (const amount of [null, 0, -1, 100000000000]) await assert.rejects(complete(account.id, amount), /monto mayor/);
    await assert.rejects(mutate(account.id, account.wallet, 'add', draft({ category: 'salary', paymentMethod: 'cash' })), /Completa tu saldo/);
    await assert.rejects(asUser(account.id, tx => tx.query('update public.profiles set onboarding_completed_at=now() where id=$1', [account.id])), /permission denied/);
    await assert.rejects(asUser(account.id, tx => tx.query("insert into public.categories(wallet_id,id,type,label) values($1,'opening_balance','income','Saldo inicial')", [account.wallet])), /reservada/);
    await assert.rejects(asUser(account.id, tx => tx.query("insert into public.categories(wallet_id,id,type,label) values($1,'custom','income',' saldo INICIAL ')", [account.wallet])), /reservada/);
    assert.equal((await entries(account.wallet)).length, 0);
    assert.equal((await profile(account.id)).onboarding_completed_at, null);
  });
  await t.test('completion creates one real income in PEN using Lima date and no payment method', async () => {
    for (const amount of [1, 12550, 99999999999]) {
      const account = await user();
      const result = await complete(account.id, amount);
      const [saved] = await entries(account.wallet);
      assert.equal(saved.id, result.initial_transaction_id);
      assert.equal(saved.amount_cents, amount);
      assert.equal(saved.type, 'income');
      assert.equal(saved.payment_method_id, null);
      assert.equal(saved.description, 'Saldo inicial');
      assert.equal(saved.created_by, account.id);
      assert.equal(saved.version, 1);
      const today = (await db.query("select to_char(now() at time zone 'America/Lima','YYYY-MM-DD') as today")).rows[0].today;
      assert.equal(saved.occurred_on.toISOString().slice(0, 10), today);
      assert.ok((await profile(account.id)).onboarding_completed_at);
      assert.equal((await db.query("select label from public.categories where wallet_id=$1 and id='opening_balance'", [account.wallet])).rows[0].label, 'Saldo inicial');
    }
  });
  await t.test('repeated and overlapping requests retain the first accepted amount and ID', async () => {
    const account = await user();
    const results = await Promise.all([complete(account.id, 100), complete(account.id, 200)]);
    assert.deepEqual(results[0], results[1]);
    assert.equal((await entries(account.wallet)).length, 1);
    assert.equal((await entries(account.wallet))[0].amount_cents, 100);
    assert.deepEqual(await complete(account.id, 999), results[0]);
  });
  await t.test('a failed insert rolls back the profile and category too', async () => {
    const account = await user();
    await db.exec(`create function public.test_fail_initial() returns trigger language plpgsql as $$
      begin raise exception 'Simulated insert failure'; end; $$;
      create trigger zzz_test_fail before insert on public.transactions for each row execute function public.test_fail_initial();`);
    await assert.rejects(complete(account.id, 100), /Simulated insert failure/);
    assert.equal((await profile(account.id)).onboarding_completed_at, null);
    assert.equal((await profile(account.id)).initial_transaction_id, null);
    assert.equal((await db.query("select id from public.categories where wallet_id=$1 and id='opening_balance'", [account.wallet])).rows.length, 0);
    await db.exec('drop trigger zzz_test_fail on public.transactions; drop function public.test_fail_initial();');
    await complete(account.id, 100);
  });
  await t.test('anonymous, unrelated and shared-wallet access cannot create or impersonate an initial balance', async () => {
    const alice = await user(), bob = await user();
    await assert.rejects(complete(null, 100), /permission denied/);
    const result = await complete(alice.id, 100);
    await assert.rejects(mutate(bob.id, alice.wallet, 'update', draft({ id: result.initial_transaction_id }), 1), /no tienes acceso/);
    const shared = (await asUser(alice.id, tx => tx.query("select public.create_shared_wallet('Casa') as id"))).rows[0].id;
    await assert.rejects(mutate(alice.id, shared, 'add', draft({ id: result.initial_transaction_id })), /conserva su identidad/);
    await assert.rejects(mutate(alice.id, alice.wallet, 'add', draft()), /conserva su identidad/);
    await assert.rejects(mutate(alice.id, alice.wallet, 'add', draft({ category: 'salary' })), /transaction_initial_balance_method/);
    assert.equal((await entries(shared)).length, 0);
    assert.equal((await profile(bob.id)).onboarding_completed_at, null);
  });
  await t.test('correction, deletion and undo keep the identity, completion and monotonic versions', async () => {
    const account = await user();
    const result = await complete(account.id, 50000);
    const item = draft({ id: result.initial_transaction_id });
    for (const change of [{ category: 'salary', paymentMethod: 'cash' }, { type: 'expense' }, { paymentMethod: 'transfer' }]) {
      await assert.rejects(mutate(account.id, account.wallet, 'update', { ...item, ...change }, 1), /conserva su identidad/);
    }
    const changed = await mutate(account.id, account.wallet, 'update', { ...item, description: '', amountCents: 65000 }, 1);
    assert.equal(changed.transaction.version, 2);
    assert.equal(changed.transaction.description, '');
    await mutate(account.id, account.wallet, 'remove', item, 2);
    assert.ok((await profile(account.id)).onboarding_completed_at);
    assert.deepEqual(await complete(account.id, 200), result);
    assert.equal((await entries(account.wallet)).length, 0);
    const restored = await mutate(account.id, account.wallet, 'restore', { ...item, amountCents: 65000 });
    assert.equal(restored.transaction.id, item.id);
    assert.equal(restored.transaction.version, 3);
    await assert.rejects(mutate(account.id, account.wallet, 'update', item, 1), /Otra persona/);
    await assert.rejects(mutate(account.id, account.wallet, 'restore', item), /duplicate key/);
    assert.equal((await profile(account.id)).initial_transaction_version, 3);
  });
});
