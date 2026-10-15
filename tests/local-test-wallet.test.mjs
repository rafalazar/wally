import test from 'node:test';
import assert from 'node:assert/strict';
import { createLocalTestWallet, LOCAL_TEST_WALLET_KEY } from '../lib/local-test-wallet.ts';
import { isLocalDevelopmentHost } from '../lib/local-test-access.ts';
import { localDate, restoredTransaction, summarize } from '../lib/finance.ts';

const storage = () => {
  const entries = new Map([['unrelated-account', 'keep']]);
  return { getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value) };
};
test('test login is restricted to development loopback hosts', () => {
  for (const host of ['localhost', '127.0.0.1', '[::1]', '::1']) assert.equal(isLocalDevelopmentHost('development', host), true);
  for (const mode of ['production', 'test', undefined]) assert.equal(isLocalDevelopmentHost(mode, 'localhost'), false);
  for (const host of ['wally.example.com', 'localhost.example.com', '192.168.1.1']) assert.equal(isLocalDevelopmentHost('development', host), false);
});
test('local onboarding persists once, supports transactions, editing and undo, and resets only test data', async () => {
  const data = storage();
  const store = createLocalTestWallet(data);
  assert.equal(store.read().completedAt, null);
  for (const amount of [0, -1, 1.5, 100000000000, NaN]) assert.throws(() => store.completeOnboarding(amount));
  assert.equal(data.getItem(LOCAL_TEST_WALLET_KEY), null);
  const state = store.completeOnboarding(100000);
  assert.equal(store.completeOnboarding(200000).initialId, state.initialId);
  assert.equal(createLocalTestWallet(data).read().wallet.transactions.length, 1);
  const expense = { id: crypto.randomUUID(), type: 'expense', amountCents: 850, description: '', category: 'food', paymentMethod: 'cash', date: localDate(), createdAt: new Date().toISOString() };
  await store.repository.execute({ type: 'add', transaction: expense });
  assert.equal(summarize((await store.repository.load()).transactions).balance, 99150);
  const initial = state.wallet.transactions[0];
  const edited = await store.repository.execute({ type: 'update', transaction: { ...initial, amountCents: 125000 } });
  await assert.rejects(store.repository.execute({ type: 'update', transaction: initial }), /cambió/);
  const current = edited.data.transactions.find(item => item.id === initial.id);
  await store.repository.execute({ type: 'remove', id: current.id, version: current.version });
  assert.ok(store.read().completedAt);
  assert.equal(store.completeOnboarding(1).wallet.transactions.length, 1, 'deleted initial balance is not recreated');
  const restored = await store.repository.execute({ type: 'restore', transaction: restoredTransaction(current) });
  assert.equal(restored.data.transactions.find(item => item.id === initial.id).version, 3);
  await assert.rejects(store.repository.execute({ type: 'restore', transaction: current }), /ya existe/);
  await assert.rejects(store.repository.execute({ type: 'add-category', category: { ...state.wallet.categories[0], id: 'forged', label: 'Saldo inicial' } }), /reservado/);
  store.reset();
  assert.equal(store.read().completedAt, null);
  assert.equal(store.read().wallet.transactions.length, 0);
  assert.equal(data.getItem('unrelated-account'), 'keep');
});
test('local persistence failures do not pretend to save or silently erase corrupt data', () => {
  const data = storage();
  const blocked = createLocalTestWallet({ getItem: data.getItem, setItem() { throw new Error('quota'); } });
  assert.throws(() => blocked.completeOnboarding(100), /No pudimos guardar/);
  assert.equal(blocked.read().completedAt, null);
  data.setItem(LOCAL_TEST_WALLET_KEY, 'broken');
  assert.throws(() => createLocalTestWallet(data).read(), /No pudimos leer/);
  assert.equal(data.getItem(LOCAL_TEST_WALLET_KEY), 'broken');
});
