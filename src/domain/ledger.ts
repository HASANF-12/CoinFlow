import type { CurrencyCode } from './currencies';
import { convert, type Rates } from './money';
import { inRange, occurrence, type Range } from './dates';
import type { AppData, Budget, Goal, RecurringRule, Transaction, Wallet } from './types';
import { newId } from './types';

/** Transfers and goal movements shift money between the user's own pots; they are not income or spending. */
export const isInternal = (tx: Transaction) => !!tx.transferId || !!tx.goalId;

export const signedAmount = (tx: Transaction) => (tx.type === 'income' ? tx.amount : -tx.amount);

export const walletBalances = (wallets: Wallet[], transactions: Transaction[]): Map<string, number> => {
  const balances = new Map(wallets.map((w) => [w.id, w.openingBalance]));
  for (const tx of transactions) {
    const current = balances.get(tx.walletId);
    if (current !== undefined) balances.set(tx.walletId, current + signedAmount(tx));
  }
  return balances;
};

export const goalSaved = (goal: Goal, transactions: Transaction[]): number => {
  let saved = goal.openingAmount;
  for (const tx of transactions) {
    if (tx.goalId !== goal.id) continue;
    const amount = tx.goalAmount ?? tx.amount;
    saved += tx.type === 'expense' ? amount : -amount;
  }
  return Math.max(0, saved);
};

export const totalIn = (
  wallets: Wallet[],
  balances: Map<string, number>,
  currency: CurrencyCode,
  rates: Rates,
): number => wallets.reduce((sum, w) => sum + convert(balances.get(w.id) ?? 0, w.currency, currency, rates), 0);

export interface Summary {
  income: number;
  expense: number;
  net: number;
  /** Expense per category, largest first. */
  byCategory: { categoryId: string; amount: number }[];
  count: number;
}

export const summarize = (
  transactions: Transaction[],
  wallets: Wallet[],
  currency: CurrencyCode,
  rates: Rates,
  range: Range,
  walletId?: string,
): Summary => {
  const currencyOf = new Map(wallets.map((w) => [w.id, w.currency]));
  let income = 0;
  let expense = 0;
  let count = 0;
  const byCat = new Map<string, number>();
  for (const tx of transactions) {
    if (isInternal(tx) || !inRange(tx.date, range)) continue;
    if (walletId && tx.walletId !== walletId) continue;
    const from = currencyOf.get(tx.walletId);
    if (!from) continue;
    const value = convert(tx.amount, from, currency, rates);
    count++;
    if (tx.type === 'income') income += value;
    else {
      expense += value;
      byCat.set(tx.categoryId, (byCat.get(tx.categoryId) ?? 0) + value);
    }
  }
  return {
    income,
    expense,
    net: income - expense,
    count,
    byCategory: [...byCat.entries()].map(([categoryId, amount]) => ({ categoryId, amount })).sort((a, b) => b.amount - a.amount),
  };
};

export const budgetSpent = (
  budget: Budget,
  transactions: Transaction[],
  wallets: Wallet[],
  rates: Rates,
  range: Range,
): number => {
  const currencyOf = new Map(wallets.map((w) => [w.id, w.currency]));
  let spent = 0;
  for (const tx of transactions) {
    if (tx.type !== 'expense' || isInternal(tx) || tx.categoryId !== budget.categoryId || !inRange(tx.date, range)) continue;
    const from = currencyOf.get(tx.walletId);
    if (from) spent += convert(tx.amount, from, budget.currency, rates);
  }
  return spent;
};

export const nextOccurrence = (rule: RecurringRule) => occurrence(rule.startDate, rule.frequency, rule.occurrences);

const MAX_CATCH_UP = 500;

/** Materialises every recurring occurrence that is due by `now`. Returns the same object when nothing is due. */
export const applyRecurring = (data: AppData, now: number): { data: AppData; created: Transaction[] } => {
  const created: Transaction[] = [];
  const walletIds = new Set(data.wallets.map((w) => w.id));
  const recurring = data.recurring.map((rule) => {
    if (!rule.active || !walletIds.has(rule.walletId)) return rule;
    let n = rule.occurrences;
    let due = occurrence(rule.startDate, rule.frequency, n);
    let guard = 0;
    while (due <= now && guard++ < MAX_CATCH_UP) {
      created.push({
        id: newId(),
        walletId: rule.walletId,
        type: rule.type,
        amount: rule.amount,
        categoryId: rule.categoryId,
        date: due,
        note: rule.note,
        tags: rule.tags,
        recurringId: rule.id,
      });
      n++;
      due = occurrence(rule.startDate, rule.frequency, n);
    }
    return n === rule.occurrences ? rule : { ...rule, occurrences: n };
  });
  if (created.length === 0) return { data, created };
  return { data: { ...data, recurring, transactions: [...created, ...data.transactions] }, created };
};

export const sortByDateDesc = (a: Transaction, b: Transaction) => b.date - a.date;
