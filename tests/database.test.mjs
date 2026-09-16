import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';

test('PostgreSQL migrations, isolation, sharing and financial integrity', async t => {
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
  const migrations = new URL('../supabase/migrations/', import.meta.url);
  for (const file of (await readdir(migrations)).filter(f => f.endsWith('.sql')).sort()) {
    await db.exec(await readFile(new URL(file, migrations), 'utf8'));
  }
  const alice = randomUUID(), bob = randomUUID(), carol = randomUUID();
  for (const [id, name] of [[alice, 'Alice'], [bob, 'Bob'], [carol, 'Carol']]) {
    await db.query('insert into auth.users values ($1,$2)', [id, JSON.stringify({ full_name: name })]);
  }
  const wallets = (await db.query('select id,owner_id from public.wallets')).rows;
  const aliceWallet = wallets.find(w => w.owner_id === alice).id;
  const bobWallet = wallets.find(w => w.owner_id === bob).id;
  const asUser = (user, action) => db.transaction(async tx => {
    await tx.exec(user ? 'set local role authenticated' : 'set local role anon');
    await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [user ?? '']);
    return action(tx);
  });
  const rpc = (user, wallet, action, item, version = null) => asUser(user, async tx =>
    (await tx.query('select public.mutate_transaction($1,$2,$3::jsonb,$4) as result', [wallet, action, JSON.stringify(item), version])).rows[0].result);
  const movement = (overrides = {}) => ({ id: randomUUID(), type: 'expense', amountCents: 850, description: 'Café', category: 'food', paymentMethod: 'cash', date: '2026-01-01', ...overrides });

  await t.test('registration provisions a private PEN wallet and twelve categories', async () => {
    assert.equal(wallets.length, 3);
    assert.equal((await db.query('select * from public.categories')).rows.length, 36);
    const result = await asUser(alice, tx => tx.query('select * from public.wallets'));
    assert.equal(result.rows.length, 1); assert.equal(result.rows[0].currency_code, 'PEN');
    const tables = await db.query("select relname, relrowsecurity from pg_class c join pg_namespace n on c.relnamespace=n.oid where n.nspname='public' and relkind='r'");
    assert.ok(tables.rows.every(table => table.relrowsecurity));
  });
  await t.test('anonymous and unrelated users cannot access another wallet', async () => {
    await assert.rejects(asUser(null, tx => tx.query('select * from public.transactions')), /permission denied/);
    await assert.rejects(asUser(bob, tx => tx.query('select public.get_wallet($1)', [aliceWallet])), /No tienes acceso/);
    await assert.rejects(rpc(bob, aliceWallet, 'add', movement()), /row-level security/);
    await assert.rejects(asUser(bob, tx => tx.query('update public.wallets set owner_id=$1 where id=$2', [bob, aliceWallet])), /permission denied/);
    await assert.rejects(asUser(bob, tx => tx.query('insert into public.wallet_members values ($1,$2,now())', [aliceWallet, bob])), /permission denied/);
  });
  await t.test('custom categories enforce wallet, type, and unique names', async () => {
    await asUser(alice, tx => tx.query("insert into public.categories(wallet_id,id,type,label) values($1,'pets','expense','Mascotas')", [aliceWallet]));
    await assert.rejects(asUser(alice, tx => tx.query("insert into public.categories(wallet_id,id,type,label) values($1,'pets2','expense',' MASCOTAS ')", [aliceWallet])), /duplicate key/);
    await assert.rejects(rpc(bob, bobWallet, 'add', movement({ category: 'pets' })), /foreign key/);
    await assert.rejects(rpc(alice, aliceWallet, 'add', movement({ category: 'pets', type: 'income' })), /foreign key/);
    await rpc(alice, aliceWallet, 'add', movement({ category: 'pets' }));
  });
  await t.test('database rejects invalid money, dates and income methods', async () => {
    for (const overrides of [{ amountCents: -1 }, { amountCents: 100000000000 }, { type: 'income', category: 'salary', paymentMethod: 'credit' }, { description: ' ' }, { date: '2099-01-01' }]) {
      await assert.rejects(rpc(alice, aliceWallet, 'add', movement(overrides)));
    }
  });
  let shared, token;
  await t.test('owner creates shared wallet and issues single-use invitation', async () => {
    shared = (await asUser(alice, tx => tx.query("select public.create_shared_wallet('Casa') as id"))).rows[0].id;
    await assert.rejects(asUser(bob, tx => tx.query('select public.create_wallet_invitation($1)', [shared])), /Solo el propietario/);
    await assert.rejects(asUser(alice, tx => tx.query('select public.create_wallet_invitation($1)', [aliceWallet])), /Solo el propietario/);
    token = (await asUser(alice, tx => tx.query('select public.create_wallet_invitation($1) as token', [shared]))).rows[0].token;
    await asUser(bob, tx => tx.query('select public.accept_wallet_invitation($1)', [token]));
    await assert.rejects(asUser(carol, tx => tx.query('select public.accept_wallet_invitation($1)', [token])), /ya se usó/);
    await assert.rejects(asUser(bob, tx => tx.query('select public.get_wallet($1)', [aliceWallet])), /No tienes acceso/);
  });
  await t.test('members edit each other’s records, with stale-edit detection', async () => {
    const item = movement();
    const created = await rpc(alice, shared, 'add', item);
    assert.equal(created.transaction.created_by, alice);
    const changed = await rpc(bob, shared, 'update', { ...item, description: 'Café compartido' }, created.transaction.version);
    assert.equal(changed.transaction.created_by, alice);
    assert.equal(changed.transaction.version, 2);
    await assert.rejects(rpc(alice, shared, 'update', item, 1), /Otra persona modificó/);
    await assert.rejects(rpc(alice, shared, 'remove', item, 1), /Otra persona modificó/);
    await rpc(alice, shared, 'remove', item, 2);
    await rpc(alice, shared, 'restore', item);
    await assert.rejects(rpc(alice, shared, 'restore', item), /duplicate key/);
  });
  await t.test('membership removal immediately denies database reads and writes', async () => {
    await asUser(bob, tx => tx.query('delete from public.wallet_members where wallet_id=$1 and user_id=$2', [shared, bob]));
    assert.equal((await db.query('select * from public.wallet_members where wallet_id=$1', [shared])).rows.length, 1);
    await asUser(alice, tx => tx.query('delete from public.wallet_members where wallet_id=$1 and user_id=$2', [shared, bob]));
    await assert.rejects(asUser(bob, tx => tx.query('select public.get_wallet($1)', [shared])), /No tienes acceso/);
    await assert.rejects(rpc(bob, shared, 'add', movement()), /row-level security/);
  });
});
