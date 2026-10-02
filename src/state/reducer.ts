import type { AppData, Budget, Goal, RecurringRule, Transaction, UserProfile, Wallet } from '../domain/types';
import { emptyData } from '../domain/types';

export type Action =
  | { type: 'replace'; data: AppData }
  | { type: 'setUser'; patch: Partial<UserProfile> }
  | { type: 'createUser'; user: UserProfile }
  | { type: 'upsertWallet'; wallet: Wallet }
  | { type: 'deleteWallet'; id: string }
  | { type: 'addTransactions'; transactions: Transaction[] }
  | { type: 'updateTransaction'; tx: Transaction }
  | { type: 'deleteTransactions'; ids: string[] }
  | { type: 'upsertBudget'; budget: Budget }
  | { type: 'deleteBudget'; id: string }
  | { type: 'upsertGoal'; goal: Goal }
  | { type: 'deleteGoal'; id: string }
  | { type: 'upsertRecurring'; rule: RecurringRule }
  | { type: 'deleteRecurring'; id: string }
  | { type: 'merge'; wallets: Wallet[]; transactions: Transaction[] }
  | { type: 'reset' };

const upsert = <T extends { id: string }>(list: T[], item: T): T[] =>
  list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item];

export const reducer = (state: AppData, action: Action): AppData => {
  switch (action.type) {
    case 'replace':
      return action.data;
    case 'createUser':
      return { ...state, user: action.user };
    case 'setUser':
      return state.user ? { ...state, user: { ...state.user, ...action.patch } } : state;
    case 'upsertWallet':
      return { ...state, wallets: upsert(state.wallets, action.wallet) };
    case 'deleteWallet':
      // The other leg of a transfer stays: that money really did arrive in the other wallet.
      return {
        ...state,
        wallets: state.wallets.filter((w) => w.id !== action.id),
        transactions: state.transactions.filter((t) => t.walletId !== action.id),
        recurring: state.recurring.filter((r) => r.walletId !== action.id),
      };
    case 'addTransactions':
      return { ...state, transactions: [...action.transactions, ...state.transactions] };
    case 'updateTransaction':
      return { ...state, transactions: state.transactions.map((t) => (t.id === action.tx.id ? action.tx : t)) };
    case 'deleteTransactions': {
      const ids = new Set(action.ids);
      return { ...state, transactions: state.transactions.filter((t) => !ids.has(t.id)) };
    }
    case 'upsertBudget':
      return { ...state, budgets: upsert(state.budgets, action.budget) };
    case 'deleteBudget':
      return { ...state, budgets: state.budgets.filter((b) => b.id !== action.id) };
    case 'upsertGoal':
      return { ...state, goals: upsert(state.goals, action.goal) };
    case 'deleteGoal':
      return { ...state, goals: state.goals.filter((g) => g.id !== action.id) };
    case 'upsertRecurring':
      return { ...state, recurring: upsert(state.recurring, action.rule) };
    case 'deleteRecurring':
      // Past occurrences stay as ordinary transactions.
      return {
        ...state,
        recurring: state.recurring.filter((r) => r.id !== action.id),
        transactions: state.transactions.map((t) => (t.recurringId === action.id ? { ...t, recurringId: undefined } : t)),
      };
    case 'merge':
      return {
        ...state,
        wallets: [...state.wallets, ...action.wallets],
        transactions: [...action.transactions, ...state.transactions],
      };
    case 'reset':
      return emptyData();
  }
};
