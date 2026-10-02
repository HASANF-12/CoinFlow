import { describe, expect, it } from 'vitest';
import { occurrence, monthRange } from './dates';
import { applyRecurring, goalSaved, summarize, walletBalances } from './ledger';
import { migrateV1, looksLikeV1, parseV2, LEGACY_GOAL_ID } from './migrate';
import { convert, formatMoney, parseAmount } from './money';
import { emptyData, type AppData } from './types';

describe('parseAmount', () => {
  it.each([
    ['1234.56', 1234.56],
    ['1,234.56', 1234.56],
    ['1.234,56', 1234.56],
    ['12,5', 12.5],
    ['1,234', 1234],
    ['1 234', 1234],
    ['٣٤٫٥', 34.5],
    ['.5', 0.5],
    ['7.', 7],
  ])('%s -> %d', (input, expected) => expect(parseAmount(input)).toBe(expected));

  it.each(['', 'abc', '1.2.3x', '--1'])('rejects %s', (input) => expect(parseAmount(input)).toBeNaN());
});

describe('formatMoney', () => {
  it('formats fiat with the right digits', () => {
    expect(formatMoney(1234.5, 'USD')).toBe('$1,234.50');
    expect(formatMoney(1000, 'JPY')).toBe('¥1,000');
    expect(formatMoney(5, 'USD', { signed: true })).toBe('+$5.00');
  });
  it('formats crypto as number + code', () => {
    expect(formatMoney(0.5, 'BTC')).toBe('0.50 BTC');
  });
});

describe('convert', () => {
  it('is identity for same currency and uses rates otherwise', () => {
    expect(convert(10, 'EUR', 'EUR', {})).toBe(10);
    expect(convert(10, 'USD', 'EUR', { USD: 1, EUR: 0.5 })).toBe(5);
    expect(convert(10, 'EUR', 'USD', { USD: 1, EUR: 0.5 })).toBe(20);
  });
});

describe('occurrence', () => {
  it('keeps the day of month and clamps short months', () => {
    const jan31 = new Date(2026, 0, 31, 9).getTime();
    expect(new Date(occurrence(jan31, 'monthly', 1)).getDate()).toBe(28);
    expect(new Date(occurrence(jan31, 'monthly', 2)).getDate()).toBe(31);
    expect(new Date(occurrence(jan31, 'monthly', 12)).getFullYear()).toBe(2027);
  });
  it('handles weekly and yearly', () => {
    const start = new Date(2024, 1, 29).getTime();
    expect(new Date(occurrence(start, 'weekly', 1)).getDate()).toBe(7);
    expect(new Date(occurrence(start, 'yearly', 1)).getDate()).toBe(28);
  });
});

const base = (): AppData => ({
  ...emptyData(),
  wallets: [
    { id: 'a', name: 'Cash', currency: 'USD', color: 'emerald', openingBalance: 100, createdAt: 0 },
    { id: 'b', name: 'Euro', currency: 'EUR', color: 'blue', openingBalance: 0, createdAt: 0 },
  ],
});

describe('ledger', () => {
  it('derives balances, keeps transfers out of stats', () => {
    const d = base();
    const now = Date.now();
    d.transactions = [
      { id: '1', walletId: 'a', type: 'expense', amount: 30, categoryId: '1', date: now, note: '', tags: [] },
      { id: '2', walletId: 'a', type: 'expense', amount: 50, categoryId: 'transfer', date: now, note: '', tags: [], transferId: 't' },
      { id: '3', walletId: 'b', type: 'income', amount: 25, categoryId: 'transfer', date: now, note: '', tags: [], transferId: 't' },
    ];
    const bal = walletBalances(d.wallets, d.transactions);
    expect(bal.get('a')).toBe(20);
    expect(bal.get('b')).toBe(25);
    const s = summarize(d.transactions, d.wallets, 'USD', {}, monthRange(now));
    expect(s.expense).toBe(30);
    expect(s.income).toBe(0);
  });

  it('computes goal savings in goal currency', () => {
    const goal = { id: 'g', name: 'Car', targetAmount: 1000, currency: 'EUR' as const, color: 'emerald' as const, openingAmount: 10, createdAt: 0 };
    const txs = [
      { id: '1', walletId: 'a', type: 'expense' as const, amount: 100, categoryId: '9', date: 0, note: '', tags: [], goalId: 'g', goalAmount: 90 },
      { id: '2', walletId: 'a', type: 'income' as const, amount: 20, categoryId: '9', date: 0, note: '', tags: [], goalId: 'g', goalAmount: 18 },
    ];
    expect(goalSaved(goal, txs)).toBe(82);
  });

  it('catches up recurring rules exactly once', () => {
    const d = base();
    const start = new Date(2026, 0, 15, 12).getTime();
    d.recurring = [
      { id: 'r', walletId: 'a', type: 'expense', amount: 10, categoryId: '6', note: 'Netflix', tags: [], frequency: 'monthly', startDate: start, occurrences: 1, active: true },
    ];
    const now = new Date(2026, 3, 20).getTime(); // Feb 15, Mar 15, Apr 15 are due
    const first = applyRecurring(d, now);
    expect(first.created).toHaveLength(3);
    expect(first.data.recurring[0].occurrences).toBe(4);
    const second = applyRecurring(first.data, now);
    expect(second.created).toHaveLength(0);
    expect(second.data).toBe(first.data);
  });
});

describe('migrateV1', () => {
  const v1 = {
    user: { name: 'Hasan', baseCurrency: 'USD', onboarded: true, securityPin: '1234', notificationsEnabled: true, lastOpenDate: 1, lastRecurringCheck: 1 },
    wallets: [
      { id: 'w1', name: 'Cash', currency: 'USD', balance: 70, color: 'from-emerald-500 to-emerald-800' },
      { id: 'w2', name: 'Bank', currency: 'EUR', balance: 45, color: 'from-blue-600 to-indigo-900' },
    ],
    transactions: [
      { id: 't1', walletId: 'w1', amount: 20, category: 'Food', type: 'expense', date: 1000, note: '', tags: [], isRecurring: false },
      { id: 'x1', walletId: 'w1', amount: 10, category: 'Transfer', type: 'expense', date: 2000, note: 'Move', tags: ['transfer'], isRecurring: false, linkedTransactionId: 'x2' },
      { id: 'x2', walletId: 'w2', amount: 9, category: 'Transfer', type: 'income', date: 2000, note: 'Move', tags: ['transfer'], isRecurring: false, linkedTransactionId: 'x1' },
      { id: 'g1', walletId: 'w1', amount: 5, category: 'Goal Funding', type: 'expense', date: 3000, note: 'Added to goal: Car', tags: ['goal'], isRecurring: false },
      { id: 'r0', walletId: 'w2', amount: 3, category: 'Bills', type: 'expense', date: 4000, note: '', tags: [], isRecurring: true, recurringFrequency: 'weekly' },
      { id: 'r1', walletId: 'w2', amount: 3, category: 'Bills', type: 'expense', date: 5000, note: '', tags: [], isRecurring: false, parentId: 'r0' },
      { id: 'c1', walletId: 'w1', amount: 2, category: 'Goal Cancelled', type: 'income', date: 6000, note: 'Goal cancelled: Old', tags: ['goal'], isRecurring: false },
    ],
    budgets: [{ id: 'b1', categoryId: '1', limit: 200, period: 'monthly' }],
    goals: [{ id: 'goal1', name: 'Car', targetAmount: 1000, currentAmount: 42, deadline: '', color: 'bg-emerald-500', currency: 'USD' }],
  };

  it('detects the v1 shape', () => {
    expect(looksLikeV1(v1)).toBe(true);
    expect(looksLikeV1({ ...emptyData() })).toBe(false);
  });

  it('preserves every balance and goal amount exactly', () => {
    const { data, legacyPin } = migrateV1(v1);
    const bal = walletBalances(data.wallets, data.transactions);
    expect(bal.get('w1')).toBe(70);
    expect(bal.get('w2')).toBe(45);
    expect(goalSaved(data.goals[0], data.transactions)).toBe(42);
    expect(legacyPin).toBe('1234');
    expect(data.user?.baseCurrency).toBe('USD');
    expect(data.budgets[0].currency).toBe('USD');
  });

  it('links transfers, goals and recurring rules', () => {
    const { data } = migrateV1(v1);
    const tx = (id: string) => data.transactions.find((t) => t.id === id)!;
    expect(tx('x1').transferId).toBe(tx('x2').transferId);
    expect(tx('g1').goalId).toBe('goal1');
    expect(tx('c1').goalId).toBe(LEGACY_GOAL_ID);
    expect(data.recurring).toHaveLength(1);
    expect(data.recurring[0]).toMatchObject({ frequency: 'weekly', occurrences: 2 });
    expect(tx('r1').recurringId).toBe(data.recurring[0].id);
    expect(data.wallets[1].color).toBe('blue');
  });

  it('round-trips through parseV2', () => {
    const { data } = migrateV1(v1);
    expect(parseV2(JSON.parse(JSON.stringify(data)))).not.toBeNull();
    expect(parseV2({ app: 'coinflow', version: 2, data })).not.toBeNull();
    expect(parseV2({ foo: 1 })).toBeNull();
  });
});
