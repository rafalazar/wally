import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemoWallet } from '../lib/finance.ts';

let sequence = 0;
async function setup(raw = JSON.stringify(createDemoWallet('2026-09-14'))) {
  Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true });
  const values = new Map([['wally.wallet.pen.v1', raw], ['wally.wallet.v1', 'legacy USD untouched']]);
  let failWrites = false;
  globalThis.window = {
    localStorage: { getItem: key => values.get(key) ?? null, setItem: (key, value) => { if (failWrites) throw new Error('quota'); values.set(key, value); } },
    addEventListener() {}, removeEventListener() {},
  };
  const { walletRepository } = await import(`../lib/wallet-store.ts?test=${sequence++}`);
  return { store: walletRepository, values, fail: () => { failWrites = true; } };
}
const own = { id: 'personal', type: 'expense', amountCents: 1234, description: 'Almuerzo personal', category: 'food', paymentMethod: 'cash', date: '2026-09-14', createdAt: '2026-09-14T16:00:00.000Z', isDemo: false };

test('PEN records persist without rewriting legacy USD data', async () => {
  const { store, values } = await setup();
  await store.execute({ type: 'add', transaction: own });
  const { store: reloaded } = await setup(values.get('wally.wallet.pen.v1'));
  assert.deepEqual((await reloaded.load()).transactions.find(item => item.id === 'personal'), own);
  assert.equal(values.get('wally.wallet.v1'), 'legacy USD untouched');
});
test('starting personal preserves real records; delete and restore round trip', async () => {
  const { store } = await setup();
  await store.execute({ type: 'add', transaction: own });
  await store.execute({ type: 'start-personal' });
  assert.deepEqual((await store.load()).transactions, [own]);
  await store.execute({ type: 'remove', id: own.id });
  assert.deepEqual((await store.load()).transactions, []);
  await store.execute({ type: 'restore', transaction: own });
  await assert.rejects(store.execute({ type: 'add', transaction: own }), /ya está registrado/);
});
test('failed writes preserve the last confirmed data', async () => {
  const { store, values, fail } = await setup();
  const before = values.get('wally.wallet.pen.v1'); fail();
  await assert.rejects(store.execute({ type: 'add', transaction: own }), /No se pudo guardar/);
  assert.equal(values.get('wally.wallet.pen.v1'), before);
});
test('corrupt storage is never replaced with examples', async () => {
  const { store, values } = await setup('{invalid');
  await assert.rejects(store.load());
  await assert.rejects(store.execute({ type: 'add', transaction: own }));
  assert.equal(values.get('wally.wallet.pen.v1'), '{invalid');
});
test('custom categories survive reload and reject incompatible transactions', async () => {
  const { store, values } = await setup();
  const category = { id: 'pets', type: 'expense', label: 'Mascotas', emoji: '🐈', tone: 'green', color: '#79bea8' };
  await store.execute({ type: 'add-category', category });
  await store.execute({ type: 'add', transaction: { ...own, category: 'pets' } });
  const { store: reloaded } = await setup(values.get('wally.wallet.pen.v1'));
  assert.ok((await reloaded.load()).categories.some(c => c.id === 'pets'));
  await assert.rejects(reloaded.execute({ type: 'update', transaction: { ...own, category: 'pets', type: 'income' } }));
  await assert.rejects(reloaded.execute({ type: 'add-category', category: { ...category, id: 'another', label: ' MASCOTAS ' } }));
});
