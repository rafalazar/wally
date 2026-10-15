import test from 'node:test';
import assert from 'node:assert/strict';
import { categories, walletSchema, isValidDate, localDate, parseAmount, recentFirst, summarize, transactionsToCsv } from '../lib/finance.ts';
import { buildMonthlyInsights, defaultFilters, filterTransactions } from '../lib/insights.ts';

const movement = (overrides = {}) => ({ id: 'test-1', type: 'expense', amountCents: 850, description: 'Café', category: 'food', paymentMethod: 'debit', date: '2026-09-14', createdAt: '2026-09-14T15:00:00.000Z', ...overrides });

test('custom categories remain consistent across search, charts and PEN exports', () => {
  const catalog = [...categories, { id: 'pets', type: 'expense', label: 'Veterinária', emoji: '🐈', tone: 'green', color: '#79bea8' }];
  const items = [movement({ category: 'pets', amountCents: 12345 })];
  assert.equal(filterTransactions(items, { ...defaultFilters, search: 'veterinaria' }, catalog).length, 1);
  const summary = buildMonthlyInsights(items, '2026-09', '2026-09-15', catalog);
  assert.equal(summary.expense, 12345);
  assert.equal(summary.breakdown[0].label, 'Veterinária');
  assert.equal(summary.breakdown[0].amount, 12345);
  assert.ok(transactionsToCsv(items, catalog).includes('"Veterinária"'));
  assert.ok(transactionsToCsv(items, catalog).includes('"123.45","PEN"'));
});

test('amounts accept decimal comma and use exact integer cents', () => {
  assert.equal(parseAmount('8,50'), 850);
  assert.equal(parseAmount('0.01'), 1);
  assert.equal(parseAmount('12.'), 1200);
  assert.equal(parseAmount(' 0008.5 '), 850);
  assert.equal(parseAmount('0.10') + parseAmount('0.20'), 30);
  assert.equal(parseAmount('999999999.99'), 99999999999);
});
test('invalid, negative, zero, ambiguous and oversized amounts are rejected', () => {
  for (const amount of ['', '0', '0.00', '-10', '1e4', 'Infinity', '12.345', '1,000.00', '1.234,56', '1000000000', 'abc']) assert.equal(parseAmount(amount), null, amount);
});
test('calendar dates are validated without rolling into another month', () => {
  assert.equal(isValidDate('2026-02-29'), false);
  assert.equal(isValidDate('2024-02-29'), true);
  assert.equal(isValidDate('2026-04-31'), false);
  assert.equal(isValidDate('not-a-date'), false);
  assert.equal(localDate(new Date(2026, 8, 14, 23, 59)), '2026-09-14');
});
test('monthly income and expenses are separate from all-time balance', () => {
  const items = [movement(), movement({ id:'2', type:'income', amountCents:10000, category:'salary' }), movement({ id:'3', amountCents:2000, date:'2026-08-30' }), movement({ id:'4', amountCents:9999, date:'2026-09-15' })];
  assert.deepEqual(summarize(items, '2026-09-14'), { balance:7150, income:10000, expense:850, incomeCount:1, expenseCount:1 });
  assert.deepEqual(summarize([], '2026-09-14'), { balance:0, income:0, expense:0, incomeCount:0, expenseCount:0 });
});
test('malformed wallet data and incompatible category types are rejected', () => {
  const wallet = (transactions) => ({ version:1, transactions });
  assert.throws(() => walletSchema.parse(wallet([movement({ amountCents:8.5 })])));
  assert.throws(() => walletSchema.parse(wallet([movement({ type:'income' })])));
  assert.throws(() => walletSchema.parse(wallet([movement(), movement()])));
  assert.throws(() => walletSchema.parse(wallet([movement({ date:'2026-02-30' })])));
  assert.throws(() => walletSchema.parse(wallet([movement({ description:' ' })])));
  assert.deepEqual(walletSchema.parse(wallet([movement()])).transactions, [movement()]);
});
test('CSV preserves cents, accents and quotes, and neutralizes formulas', () => {
  const csv = transactionsToCsv([movement({ description:'=SUM(A1)' }), movement({ id:'2', description:'Café, "grande"\ncon leche' })]);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('"\'=SUM(A1)"'));
  assert.ok(csv.includes('"Café, ""grande""\ncon leche"'));
  assert.ok(csv.includes('"8.50","PEN"'));
});

test("new movements sort before earlier records across midnight", () => {
  const previous = movement({ createdAt: "2026-09-14T23:59:59.000Z" });
  const fresh = movement({ id: "after-midnight", date: "2026-09-15", createdAt: "2026-09-15T00:00:01.000Z" });
  assert.equal(recentFirst([previous, fresh])[0].id, "after-midnight");
});
