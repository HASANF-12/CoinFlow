import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import { GOAL_CATEGORY, getCategory, TRANSFER_CATEGORY } from '../domain/categories';
import { monthRange } from '../domain/dates';
import { applyRecurring, budgetSpent, goalSaved, walletBalances } from '../domain/ledger';
import { convert, roundMoney, type Rates } from '../domain/money';
import type { AppData, Frequency, Goal, RecurringRule, Transaction } from '../domain/types';
import { emptyData, newId } from '../domain/types';
import { categoryLabel, t } from '../i18n';
import { track } from '../services/analytics';
import { notifyNow } from '../services/notifications';
import { fetchRates, isStale, loadCachedRates, type RatesState } from '../services/rates';
import { deleteReceipt, externalizeReceipts } from '../services/receipts';
import { hashPin, newSalt } from '../services/security';
import { loadData, saveData } from '../services/storage';
import { reducer, type Action } from './reducer';

export interface StartupInfo {
  migratedFromV1: boolean;
  recurringCreated: number;
}

export type NewTransaction = Omit<Transaction, 'id'>;

interface StoreValue {
  ready: boolean;
  data: AppData;
  balances: Map<string, number>;
  rates: Rates;
  ratesUpdatedAt: number;
  startup: StartupInfo;
  dispatch: (a: Action) => void;
  refreshRates: () => Promise<boolean>;
  addTransaction: (tx: NewTransaction, repeat?: Frequency) => Transaction;
  updateTransaction: (tx: Transaction) => void;
  /** Deletes a transaction (both legs for a transfer). Returns what was removed so the UI can offer undo. */
  deleteTransaction: (id: string) => Transaction[];
  restoreTransactions: (txs: Transaction[]) => void;
  /** Permanently drops receipt files once an undo window has passed. */
  purgeReceipts: (txs: Transaction[]) => void;
  transfer: (p: { fromId: string; toId: string; amount: number; received: number; date: number; note: string }) => void;
  fundGoal: (goalId: string, walletId: string, amount: number) => { reached: boolean };
  withdrawGoal: (goalId: string, walletId: string, goalAmount: number) => void;
  deleteGoal: (goalId: string, refundWalletId?: string) => void;
  setPin: (pin: string | null) => Promise<void>;
}

const StoreContext = createContext<StoreValue | null>(null);

export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore outside StoreProvider');
  return ctx;
};

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [data, dispatch] = useReducer(reducer, undefined, emptyData);
  const [ready, setReady] = useState(false);
  const [ratesState, setRatesState] = useState<RatesState>(loadCachedRates);
  const [startup, setStartup] = useState<StartupInfo>({ migratedFromV1: false, recurringCreated: 0 });
  const dataRef = useRef(data);
  dataRef.current = data;
  const ratesRef = useRef(ratesState.rates);
  ratesRef.current = ratesState.rates;

  // Load once, migrate v1 data if needed, then catch up recurring transactions.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await loadData();
      let loaded = result.data ?? emptyData();
      if (result.legacyPin && loaded.user) {
        const salt = newSalt();
        loaded = { ...loaded, user: { ...loaded.user, pinSalt: salt, pinHash: await hashPin(result.legacyPin, salt) } };
      }
      const transactions = await externalizeReceipts(loaded.transactions);
      if (transactions !== loaded.transactions) loaded = { ...loaded, transactions };
      const { data: withRecurring, created } = applyRecurring(loaded, Date.now());
      if (cancelled) return;
      dispatch({ type: 'replace', data: withRecurring });
      setStartup({ migratedFromV1: result.source === 'v1', recurringCreated: created.length });
      setReady(true);
      // Persist immediately after a migration so v2 owns the data from now on.
      if (result.source === 'v1' || created.length || transactions !== result.data?.transactions) saveData(withRecurring);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const firstRender = useRef(true);
  useEffect(() => {
    if (!ready) return;
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    saveData(data);
  }, [data, ready]);

  const refreshRates = useCallback(async () => {
    const fresh = await fetchRates();
    if (fresh) setRatesState(fresh);
    return !!fresh;
  }, []);

  useEffect(() => {
    if (isStale(ratesState)) void refreshRates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const balances = useMemo(() => walletBalances(data.wallets, data.transactions), [data.wallets, data.transactions]);

  const checkBudget = useCallback((tx: Transaction, before: AppData, after: AppData) => {
    if (tx.type !== 'expense' || tx.transferId || tx.goalId || !after.user?.notificationsEnabled) return;
    const range = monthRange(tx.date);
    for (const budget of after.budgets.filter((b) => b.categoryId === tx.categoryId)) {
      const prev = budgetSpent(budget, before.transactions, before.wallets, ratesRef.current, range) / budget.limit;
      const now = budgetSpent(budget, after.transactions, after.wallets, ratesRef.current, range) / budget.limit;
      const cat = categoryLabel(getCategory(budget.categoryId));
      if (prev < 1 && now >= 1) void notifyNow(t('notif.budgetOver.title'), t('notif.budgetOver.body', { category: cat }));
      else if (prev < 0.8 && now >= 0.8) void notifyNow(t('notif.budgetWarn.title'), t('notif.budgetWarn.body', { category: cat }));
    }
  }, []);

  const addTransaction = useCallback(
    (input: NewTransaction, repeat?: Frequency) => {
      const tx: Transaction = { ...input, id: newId() };
      const before = dataRef.current;
      let added = [tx];
      if (repeat) {
        const rule: RecurringRule = {
          id: newId(),
          walletId: tx.walletId,
          type: tx.type,
          amount: tx.amount,
          categoryId: tx.categoryId,
          note: tx.note,
          tags: tx.tags,
          frequency: repeat,
          startDate: tx.date,
          occurrences: 1,
          active: true,
        };
        tx.recurringId = rule.id;
        // A repeating entry dated in the past may already owe occurrences.
        const caughtUp = applyRecurring({ ...emptyData(), wallets: before.wallets, recurring: [rule] }, Date.now());
        added = [...caughtUp.created, tx];
        dispatch({ type: 'upsertRecurring', rule: caughtUp.data.recurring[0] });
        track('recurring_created', { frequency: repeat });
      }
      dispatch({ type: 'addTransactions', transactions: added });
      checkBudget(tx, before, { ...before, transactions: [...added, ...before.transactions] });
      track('transaction_added', { type: tx.type, category: tx.categoryId, has_receipt: !!tx.receipt, is_first: before.transactions.length === 0 });
      return tx;
    },
    [checkBudget],
  );

  const updateTransaction = useCallback((tx: Transaction) => {
    const old = dataRef.current.transactions.find((t) => t.id === tx.id);
    if (old?.receipt && old.receipt !== tx.receipt) void deleteReceipt(old.receipt);
    dispatch({ type: 'updateTransaction', tx });
    track('transaction_updated');
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    const all = dataRef.current.transactions;
    const tx = all.find((t) => t.id === id);
    if (!tx) return [];
    const removed = tx.transferId ? all.filter((t) => t.transferId === tx.transferId) : [tx];
    dispatch({ type: 'deleteTransactions', ids: removed.map((t) => t.id) });
    track('transaction_deleted', { was_transfer: !!tx.transferId });
    return removed;
  }, []);

  const restoreTransactions = useCallback((txs: Transaction[]) => dispatch({ type: 'addTransactions', transactions: txs }), []);
  const purgeReceipts = useCallback((txs: Transaction[]) => txs.forEach((tx) => void deleteReceipt(tx.receipt)), []);

  const transfer: StoreValue['transfer'] = useCallback(({ fromId, toId, amount, received, date, note }) => {
    const transferId = newId();
    const base = { categoryId: TRANSFER_CATEGORY, date, note, tags: [], transferId };
    dispatch({
      type: 'addTransactions',
      transactions: [
        { ...base, id: newId(), walletId: fromId, type: 'expense', amount },
        { ...base, id: newId(), walletId: toId, type: 'income', amount: received },
      ],
    });
    track('transfer_completed');
  }, []);

  const goalById = (id: string): Goal | undefined => dataRef.current.goals.find((g) => g.id === id);
  const walletById = (id: string) => dataRef.current.wallets.find((w) => w.id === id);

  const fundGoal = useCallback((goalId: string, walletId: string, amount: number) => {
    const goal = goalById(goalId);
    const wallet = walletById(walletId);
    if (!goal || !wallet) return { reached: false };
    const goalAmount = roundMoney(convert(amount, wallet.currency, goal.currency, ratesRef.current), goal.currency);
    const before = goalSaved(goal, dataRef.current.transactions);
    dispatch({
      type: 'addTransactions',
      transactions: [
        { id: newId(), walletId, type: 'expense', amount, categoryId: GOAL_CATEGORY, date: Date.now(), note: goal.name, tags: [], goalId, goalAmount },
      ],
    });
    const reached = before < goal.targetAmount && before + goalAmount >= goal.targetAmount;
    if (reached && dataRef.current.user?.notificationsEnabled) {
      void notifyNow(t('notif.goal.title'), t('notif.goal.body', { goal: goal.name }));
    }
    track('goal_funded', { reached });
    return { reached };
  }, []);

  const withdrawGoal = useCallback((goalId: string, walletId: string, goalAmount: number) => {
    const goal = goalById(goalId);
    const wallet = walletById(walletId);
    if (!goal || !wallet) return;
    const amount = roundMoney(convert(goalAmount, goal.currency, wallet.currency, ratesRef.current), wallet.currency);
    dispatch({
      type: 'addTransactions',
      transactions: [
        { id: newId(), walletId, type: 'income', amount, categoryId: GOAL_CATEGORY, date: Date.now(), note: goal.name, tags: [], goalId, goalAmount },
      ],
    });
  }, []);

  const deleteGoal = useCallback(
    (goalId: string, refundWalletId?: string) => {
      const goal = goalById(goalId);
      if (!goal) return;
      const saved = goalSaved(goal, dataRef.current.transactions);
      if (refundWalletId && saved > 0) withdrawGoal(goalId, refundWalletId, saved);
      dispatch({ type: 'deleteGoal', id: goalId });
      track('goal_deleted', { refunded: !!refundWalletId });
    },
    [withdrawGoal],
  );

  const setPin = useCallback(async (pin: string | null) => {
    if (pin === null) {
      dispatch({ type: 'setUser', patch: { pinHash: undefined, pinSalt: undefined, biometricUnlock: false } });
      return;
    }
    const salt = newSalt();
    dispatch({ type: 'setUser', patch: { pinSalt: salt, pinHash: await hashPin(pin, salt), pinPromptSeen: true } });
    track('pin_set');
  }, []);

  const value: StoreValue = {
    ready,
    data,
    balances,
    rates: ratesState.rates,
    ratesUpdatedAt: ratesState.updatedAt,
    startup,
    dispatch,
    refreshRates,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    restoreTransactions,
    purgeReceipts,
    transfer,
    fundGoal,
    withdrawGoal,
    deleteGoal,
    setPin,
  };
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};
