import { categoryIdFromV1Name, GOAL_CATEGORY, TRANSFER_CATEGORY } from './categories';
import { isCurrencyCode, type CurrencyCode } from './currencies';
import { convert, type Rates } from './money';
import { signedAmount } from './ledger';
import type { AppData, Budget, Frequency, Goal, RecurringRule, Transaction, TxType, Wallet, WalletColor } from './types';
import { emptyData, newId } from './types';

/** Goal-linked v1 transactions whose goal no longer exists. Still internal, just unattached. */
export const LEGACY_GOAL_ID = 'legacy-goal';

const WALLET_COLORS: WalletColor[] = ['emerald', 'blue', 'rose', 'purple', 'slate', 'teal', 'amber', 'sky'];

const colorFromV1 = (cls: unknown, index: number): WalletColor => {
  if (typeof cls === 'string') {
    for (const c of WALLET_COLORS) if (cls.includes(c)) return c;
    if (cls.includes('indigo') || cls.includes('violet')) return 'purple';
    if (cls.includes('orange')) return 'rose';
    if (cls.includes('cyan')) return 'teal';
  }
  return WALLET_COLORS[index % WALLET_COLORS.length];
};

const num = (v: unknown, fallback = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback);
const currency = (v: unknown, fallback: CurrencyCode): CurrencyCode => (isCurrencyCode(v) ? v : fallback);
const txType = (v: unknown): TxType => (v === 'income' ? 'income' : 'expense');
const FREQUENCIES: Frequency[] = ['daily', 'weekly', 'monthly', 'yearly'];

type Raw = Record<string, any>;

/** True for the v1 storage/backup shape (localStorage "moneyflow_app_v1" or its JSON export). */
export const looksLikeV1 = (raw: unknown): raw is Raw =>
  !!raw &&
  typeof raw === 'object' &&
  Array.isArray((raw as Raw).wallets) &&
  (raw as Raw).version === undefined &&
  ((raw as Raw).wallets.some((w: Raw) => 'balance' in w) ||
    ((raw as Raw).transactions ?? []).some((t: Raw) => typeof t.category === 'string'));

export interface V1Migration {
  data: AppData;
  /** v1 kept the PIN in plain text; the caller hashes it (async) and discards it. */
  legacyPin?: string;
}

export const migrateV1 = (raw: Raw, rates: Rates = {}): V1Migration => {
  const data = emptyData();
  const u = raw.user as Raw | null | undefined;
  const base = currency(u?.baseCurrency, 'USD');

  const v1Wallets: Raw[] = Array.isArray(raw.wallets) ? raw.wallets : [];
  const v1Txs: Raw[] = Array.isArray(raw.transactions) ? raw.transactions : [];
  const v1Goals: Raw[] = Array.isArray(raw.goals) ? raw.goals : [];
  const v1Budgets: Raw[] = Array.isArray(raw.budgets) ? raw.budgets : [];

  data.wallets = v1Wallets.map<Wallet>((w, i) => ({
    id: str(w.id, newId()),
    name: str(w.name, 'Wallet'),
    currency: currency(w.currency, base),
    color: colorFromV1(w.color, i),
    openingBalance: 0,
    createdAt: 0,
  }));
  const walletCurrency = new Map(data.wallets.map((w) => [w.id, w.currency]));

  data.goals = v1Goals.map<Goal>((g, i) => ({
    id: str(g.id, newId()),
    name: str(g.name, 'Goal'),
    targetAmount: Math.max(0, num(g.targetAmount)),
    currency: currency(g.currency, base),
    deadline: str(g.deadline) || undefined,
    color: colorFromV1(g.color, i),
    openingAmount: 0,
    createdAt: 0,
  }));
  const goalByName = new Map<string, Goal>();
  for (const g of data.goals) if (!goalByName.has(g.name)) goalByName.set(g.name, g);

  // Recurring templates (v1 stored them as ordinary transactions with isRecurring && !parentId).
  const ruleByTemplate = new Map<string, RecurringRule>();
  for (const t of v1Txs) {
    if (!t.isRecurring || t.parentId) continue;
    const rule: RecurringRule = {
      id: newId(),
      walletId: str(t.walletId),
      type: txType(t.type),
      amount: Math.abs(num(t.amount)),
      categoryId: categoryIdFromV1Name(str(t.category), txType(t.type)),
      note: str(t.note),
      tags: Array.isArray(t.tags) ? t.tags.filter((x: unknown) => typeof x === 'string') : [],
      frequency: FREQUENCIES.includes(t.recurringFrequency) ? t.recurringFrequency : 'monthly',
      startDate: num(t.date, Date.now()),
      occurrences: 1 + v1Txs.filter((c) => c.parentId === t.id).length,
      active: true,
    };
    ruleByTemplate.set(str(t.id), rule);
  }
  data.recurring = [...ruleByTemplate.values()];

  data.transactions = v1Txs
    .filter((t) => walletCurrency.has(str(t.walletId)) && Number.isFinite(t.amount))
    .map<Transaction>((t) => {
      const type = txType(t.type);
      const name = str(t.category);
      const note = str(t.note);
      const tx: Transaction = {
        id: str(t.id, newId()),
        walletId: str(t.walletId),
        type,
        // v1 never stored negative amounts on purpose; normalise just in case.
        amount: Math.abs(num(t.amount)),
        categoryId: categoryIdFromV1Name(name, type),
        date: num(t.date, Date.now()),
        note,
        tags: Array.isArray(t.tags) ? t.tags.filter((x: unknown) => typeof x === 'string') : [],
      };
      if (num(t.amount) < 0) tx.type = type === 'income' ? 'expense' : 'income';
      if (typeof t.receipt === 'string' && t.receipt) tx.receipt = t.receipt;

      if (tx.categoryId === TRANSFER_CATEGORY) {
        tx.transferId = t.linkedTransactionId ? [tx.id, str(t.linkedTransactionId)].sort().join(':') : tx.id;
      } else if (tx.categoryId === GOAL_CATEGORY) {
        const goalName = note.match(/^(?:Added to goal|Removed from goal|Goal cancelled): (.+)$/)?.[1];
        const goal = name === 'Goal Cancelled' ? undefined : goalName ? goalByName.get(goalName) : undefined;
        tx.goalId = goal?.id ?? LEGACY_GOAL_ID;
        if (goal) tx.goalAmount = convert(tx.amount, walletCurrency.get(tx.walletId)!, goal.currency, rates);
      }

      const rule = ruleByTemplate.get(str(t.id)) ?? ruleByTemplate.get(str(t.parentId));
      if (rule) tx.recurringId = rule.id;
      return tx;
    });

  // Balances are derived in v2, so solve for the opening balance that reproduces the v1 balance exactly.
  const sums = new Map<string, number>();
  for (const tx of data.transactions) sums.set(tx.walletId, (sums.get(tx.walletId) ?? 0) + signedAmount(tx));
  data.wallets = data.wallets.map((w, i) => ({
    ...w,
    openingBalance: num(v1Wallets[i].balance) - (sums.get(w.id) ?? 0),
    createdAt: Math.min(Date.now(), ...data.transactions.filter((t) => t.walletId === w.id).map((t) => t.date)),
  }));

  data.goals = data.goals.map((g, i) => {
    let derived = 0;
    for (const tx of data.transactions) {
      if (tx.goalId !== g.id) continue;
      derived += (tx.type === 'expense' ? 1 : -1) * (tx.goalAmount ?? tx.amount);
    }
    return { ...g, openingAmount: num(v1Goals[i].currentAmount) - derived, createdAt: Date.now() };
  });

  data.budgets = v1Budgets
    .filter((b) => Number.isFinite(b.limit) && b.limit > 0)
    .map<Budget>((b) => ({
      id: str(b.id, newId()),
      categoryId: str(b.categoryId, 'exp-other'),
      limit: num(b.limit),
      currency: currency(b.currency, base),
    }));

  if (u && u.onboarded) {
    data.user = {
      name: str(u.name),
      baseCurrency: base,
      notificationsEnabled: !!u.notificationsEnabled,
      onboardedAt: num(u.lastOpenDate, Date.now()),
      lastOpenDate: num(u.lastOpenDate, Date.now()),
      // Existing users already met the PIN prompt in v1.
      pinPromptSeen: true,
    };
  }

  const pin = typeof u?.securityPin === 'string' && /^\d{4}$/.test(u.securityPin) ? u.securityPin : undefined;
  return { data, legacyPin: pin };
};

/** Light structural validation for v2 data coming from storage or an imported backup. */
export const parseV2 = (raw: unknown): AppData | null => {
  const r = (raw && typeof raw === 'object' && (raw as Raw).app === 'coinflow' ? (raw as Raw).data : raw) as Raw;
  if (!r || typeof r !== 'object' || r.version !== 2) return null;
  const arrays = ['wallets', 'transactions', 'budgets', 'goals', 'recurring'] as const;
  if (!arrays.every((k) => Array.isArray(r[k]))) return null;
  const walletIds = new Set(r.wallets.map((w: Raw) => w.id));
  return {
    ...emptyData(),
    ...r,
    transactions: r.transactions.filter(
      (t: Raw) => walletIds.has(t.walletId) && Number.isFinite(t.amount) && Number.isFinite(t.date),
    ),
  } as AppData;
};
