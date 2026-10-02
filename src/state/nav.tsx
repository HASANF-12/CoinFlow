import { createContext, useContext } from 'react';
import type { Transaction, TxType } from '../domain/types';

export type Tab = 'home' | 'activity' | 'plan' | 'wallets' | 'settings';
export type PlanSection = 'budgets' | 'goals' | 'recurring';

export interface EditorRequest {
  mode?: TxType | 'transfer';
  /** Edit an existing transaction. */
  tx?: Transaction;
  /** Pre-fill from an existing transaction as a new entry ("add again"). */
  copyOf?: Transaction;
  walletId?: string;
}

export interface Nav {
  tab: Tab;
  go: (tab: Tab, section?: PlanSection) => void;
  planSection: PlanSection;
  openEditor: (req?: EditorRequest) => void;
  openTransaction: (tx: Transaction) => void;
}

export const NavContext = createContext<Nav | null>(null);

export const useNav = () => {
  const nav = useContext(NavContext);
  if (!nav) throw new Error('useNav outside NavContext');
  return nav;
};
