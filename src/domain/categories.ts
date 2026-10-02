import type { TxType } from './types';

export interface Category {
  id: string;
  /** English name; also the v1 identifier (v1 stored category names on transactions). */
  name: string;
  icon: string;
  type: TxType;
  color: string;
  /** System categories are assigned automatically and hidden from pickers. */
  system?: boolean;
}

// Ids are shared with v1 so migrated budgets keep pointing at the right category.
export const CATEGORIES: Category[] = [
  { id: '1', name: 'Food', icon: '🍔', type: 'expense', color: '#f87171' },
  { id: '2', name: 'Rent', icon: '🏠', type: 'expense', color: '#fbbf24' },
  { id: '3', name: 'Transport', icon: '🚗', type: 'expense', color: '#34d399' },
  { id: '5', name: 'Shopping', icon: '🛍️', type: 'expense', color: '#818cf8' },
  { id: '6', name: 'Bills', icon: '📄', type: 'expense', color: '#60a5fa' },
  { id: '7', name: 'Health', icon: '💊', type: 'expense', color: '#f472b6' },
  { id: '10', name: 'Travel', icon: '✈️', type: 'expense', color: '#38bdf8' },
  { id: '11', name: 'Entertainment', icon: '🎬', type: 'expense', color: '#a78bfa' },
  { id: '12', name: 'Education', icon: '📚', type: 'expense', color: '#fb923c' },
  { id: '13', name: 'Utilities', icon: '💡', type: 'expense', color: '#facc15' },
  { id: '14', name: 'Gifts', icon: '🎁', type: 'expense', color: '#ec4899' },
  { id: 'exp-other', name: 'Other', icon: '📦', type: 'expense', color: '#94a3b8' },

  { id: '4', name: 'Salary', icon: '💰', type: 'income', color: '#10b981' },
  { id: '8', name: 'Investments', icon: '📈', type: 'income', color: '#a78bfa' },
  { id: '15', name: 'Freelance', icon: '💻', type: 'income', color: '#0ea5e9' },
  { id: '16', name: 'Refund', icon: '🔄', type: 'income', color: '#94a3b8' },
  { id: '17', name: 'Business', icon: '🏢', type: 'income', color: '#6366f1' },
  { id: 'inc-other', name: 'Other', icon: '📦', type: 'income', color: '#94a3b8' },

  { id: 'transfer', name: 'Transfer', icon: '🔁', type: 'expense', color: '#64748b', system: true },
  { id: '9', name: 'Savings goal', icon: '🎯', type: 'expense', color: '#2bb39a', system: true },
];

export const TRANSFER_CATEGORY = 'transfer';
export const GOAL_CATEGORY = '9';

const byId = new Map(CATEGORIES.map((c) => [c.id, c]));

export const getCategory = (id: string): Category => byId.get(id) ?? byId.get('exp-other')!;

export const pickableCategories = (type: TxType): Category[] =>
  CATEGORIES.filter((c) => c.type === type && !c.system);

/** Maps a v1 category name (as stored on v1 transactions) to a v2 category id. */
export const categoryIdFromV1Name = (name: string, type: TxType): string => {
  if (name === 'Transfer') return TRANSFER_CATEGORY;
  if (name.startsWith('Goal')) return GOAL_CATEGORY;
  if (name === 'Other') return type === 'income' ? 'inc-other' : 'exp-other';
  const match = CATEGORIES.find((c) => c.name === name && !c.system);
  return match?.id ?? (type === 'income' ? 'inc-other' : 'exp-other');
};
