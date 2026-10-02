import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, PiggyBank, Plus, Target, Trash2 } from 'lucide-react';
import { getCategory, pickableCategories } from '../domain/categories';
import type { CurrencyCode } from '../domain/currencies';
import { monthRange } from '../domain/dates';
import { budgetSpent, goalSaved, nextOccurrence, walletBalances } from '../domain/ledger';
import { formatMoney, parseAmount } from '../domain/money';
import type { Budget, Goal, RecurringRule, WalletColor } from '../domain/types';
import { newId } from '../domain/types';
import { categoryLabel, formatDate, frequencyLabel, t, tn } from '../i18n';
import { track } from '../services/analytics';
import { useNav, type PlanSection } from '../state/nav';
import { useStore } from '../state/store';
import { AmountInput } from '../ui/AmountInput';
import { Button, Card, cx, EmptyState, Field, IconButton, inputClass, Progress, ScreenHeader, Segmented, Toggle } from '../ui/kit';
import { CategoryGrid, ColorPicker, CurrencyField, WALLET_COLORS, WALLET_GRADIENTS, WalletChips } from '../ui/pickers';
import { ConfirmSheet, Sheet } from '../ui/Sheet';
import { useToast } from '../ui/Toast';

export const Plan = () => {
  const nav = useNav();
  const [section, setSection] = useState<PlanSection>(nav.planSection);
  useEffect(() => setSection(nav.planSection), [nav.planSection]);
  const [adding, setAdding] = useState(false);

  return (
    <div className="animate-in fade-in duration-300">
      <ScreenHeader
        title={t('plan.title')}
        actions={
          section !== 'recurring' && (
            <IconButton label={t('common.add')} onClick={() => setAdding(true)} className="bg-brand text-brand-ink border-0">
              <Plus size={22} />
            </IconButton>
          )
        }
      />
      <Segmented
        className="mb-5"
        value={section}
        onChange={setSection}
        options={[
          { value: 'budgets', label: t('plan.budgets') },
          { value: 'goals', label: t('plan.goals') },
          { value: 'recurring', label: t('plan.recurring') },
        ]}
      />
      {section === 'budgets' && <Budgets adding={adding} onAddDone={() => setAdding(false)} onAdd={() => setAdding(true)} />}
      {section === 'goals' && <Goals adding={adding} onAddDone={() => setAdding(false)} onAdd={() => setAdding(true)} />}
      {section === 'recurring' && <Recurring />}
    </div>
  );
};

/* ---------------------------------- Budgets --------------------------------- */

const Budgets = ({ adding, onAdd, onAddDone }: { adding: boolean; onAdd: () => void; onAddDone: () => void }) => {
  const { data, rates } = useStore();
  const [editing, setEditing] = useState<Budget | null>(null);
  const range = useMemo(() => monthRange(Date.now()), []);
  const daysLeft = Math.max(1, Math.ceil((range.end - Date.now()) / 86_400_000));

  return (
    <>
      <p className="mb-4 px-1 text-sm text-muted">{tn('budgets.intro', daysLeft, { month: formatDate(range.start, 'month') })}</p>
      {data.budgets.length === 0 ? (
        <EmptyState icon={<PiggyBank size={26} />} title={t('budgets.empty')} body={t('budgets.emptyBody')} action={<Button onClick={onAdd}>{t('budgets.add')}</Button>} />
      ) : (
        <div className="space-y-3">
          {data.budgets.map((b) => {
            const spent = budgetSpent(b, data.transactions, data.wallets, rates, range);
            const ratio = spent / b.limit;
            const left = b.limit - spent;
            const c = getCategory(b.categoryId);
            return (
              <Card key={b.id} onClick={() => setEditing(b)}>
                <div className="mb-3 flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-surface-2 text-xl">{c.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-ink">{categoryLabel(c)}</p>
                    <p className={cx('text-sm', left < 0 ? 'text-danger' : 'text-muted')}>
                      {left >= 0
                        ? t('budgets.left', { amount: formatMoney(left, b.currency), perDay: formatMoney(left / daysLeft, b.currency) })
                        : t('budgets.over', { amount: formatMoney(-left, b.currency) })}
                    </p>
                  </div>
                  <span className="tabular text-sm text-muted">{Math.round(ratio * 100)}%</span>
                </div>
                <Progress value={ratio} tone={ratio >= 1 ? 'danger' : ratio >= 0.8 ? 'warn' : 'brand'} />
                <p className="tabular mt-2 text-sm text-faint">
                  {formatMoney(spent, b.currency)} / {formatMoney(b.limit, b.currency)}
                </p>
              </Card>
            );
          })}
        </div>
      )}
      <BudgetSheet
        budget={adding ? 'new' : editing}
        onClose={() => {
          setEditing(null);
          onAddDone();
        }}
      />
    </>
  );
};

const BudgetSheet = ({ budget, onClose }: { budget: Budget | 'new' | null; onClose: () => void }) => {
  const { data, dispatch } = useStore();
  const existing = budget && budget !== 'new' ? budget : null;
  const used = new Set(data.budgets.filter((b) => b.id !== existing?.id).map((b) => b.categoryId));
  const firstFree = pickableCategories('expense').find((c) => !used.has(c.id))?.id ?? '1';
  const [categoryId, setCategoryId] = useState(firstFree);
  const [limit, setLimit] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>(data.user!.baseCurrency);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    if (!budget) return;
    setCategoryId(existing?.categoryId ?? firstFree);
    setLimit(existing ? String(existing.limit) : '');
    setCurrency(existing?.currency ?? data.user!.baseCurrency);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budget]);

  const value = parseAmount(limit);
  const duplicate = used.has(categoryId);
  const save = () => {
    if (!(value > 0) || duplicate) return;
    dispatch({ type: 'upsertBudget', budget: { id: existing?.id ?? newId(), categoryId, limit: value, currency } });
    if (!existing) track('budget_created', { category: categoryId });
    onClose();
  };

  return (
    <Sheet
      open={!!budget}
      onClose={onClose}
      title={existing ? t('budgets.edit') : t('budgets.add')}
      footer={
        <div className="flex gap-3">
          {existing && (
            <Button variant="danger" onClick={() => setConfirm(true)}>
              {t('common.delete')}
            </Button>
          )}
          <Button block size="lg" onClick={save} disabled={!(value > 0) || duplicate}>
            {t('common.save')}
          </Button>
        </div>
      }
    >
      <div className="space-y-5 pt-2">
        <div className="rounded-3xl border border-line bg-surface-2">
          <AmountInput value={limit} onChange={setLimit} currency={currency} label={t('budgets.limit')} autoFocus={!existing} />
          <p className="-mt-2 pb-3 text-center text-sm text-muted">{t('budgets.perMonth')}</p>
        </div>
        <Field label={t('editor.category')} hint={duplicate ? t('budgets.duplicate') : undefined}>
          <CategoryGrid type="expense" value={categoryId} onChange={setCategoryId} />
        </Field>
        <Field label={t('wallet.currency')}>
          <CurrencyField value={currency} onChange={setCurrency} />
        </Field>
      </div>
      <ConfirmSheet
        open={confirm}
        danger
        title={t('budgets.deleteTitle')}
        confirmLabel={t('common.delete')}
        onConfirm={() => {
          if (existing) dispatch({ type: 'deleteBudget', id: existing.id });
          track('budget_deleted');
          setConfirm(false);
          onClose();
        }}
        onClose={() => setConfirm(false)}
      />
    </Sheet>
  );
};

/* ----------------------------------- Goals ---------------------------------- */

const monthsUntil = (deadline?: string) => {
  if (!deadline) return null;
  const end = new Date(deadline).getTime();
  if (!Number.isFinite(end)) return null;
  return Math.max(0, (end - Date.now()) / (30.44 * 86_400_000));
};

const Goals = ({ adding, onAdd, onAddDone }: { adding: boolean; onAdd: () => void; onAddDone: () => void }) => {
  const { data } = useStore();
  const [editing, setEditing] = useState<Goal | null>(null);
  const [moving, setMoving] = useState<{ goal: Goal; direction: 'in' | 'out' } | null>(null);

  return (
    <>
      {data.goals.length === 0 ? (
        <EmptyState icon={<Target size={26} />} title={t('goals.empty')} body={t('goals.emptyBody')} action={<Button onClick={onAdd}>{t('goals.add')}</Button>} />
      ) : (
        <div className="space-y-3">
          {data.goals.map((g) => {
            const saved = goalSaved(g, data.transactions);
            const ratio = g.targetAmount > 0 ? saved / g.targetAmount : 0;
            const months = monthsUntil(g.deadline);
            const remaining = Math.max(0, g.targetAmount - saved);
            return (
              <Card key={g.id}>
                <button type="button" className="press flex w-full items-center gap-3 text-start" onClick={() => setEditing(g)}>
                  <span className="grid size-11 place-items-center rounded-2xl text-white" style={{ background: WALLET_GRADIENTS[g.color] }}>
                    <Target size={20} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold text-ink">{g.name}</span>
                    <span className="block text-sm text-muted">
                      {ratio >= 1
                        ? t('goals.reached')
                        : months !== null && months > 0
                          ? t('goals.perMonth', { amount: formatMoney(remaining / Math.max(1, months), g.currency), date: formatDate(new Date(g.deadline!).getTime(), 'short') })
                          : t('goals.toGo', { amount: formatMoney(remaining, g.currency) })}
                    </span>
                  </span>
                  <span className="tabular text-sm font-semibold text-ink">{Math.min(100, Math.round(ratio * 100))}%</span>
                </button>
                <div className="mt-3">
                  <Progress value={ratio} tone={ratio >= 1 ? 'income' : 'brand'} />
                </div>
                <p className="tabular mt-2 text-sm text-muted">
                  {formatMoney(saved, g.currency)} / {formatMoney(g.targetAmount, g.currency)}
                </p>
                <div className={cx('mt-3 grid gap-2', saved > 0 ? 'grid-cols-2' : 'grid-cols-1')}>
                  {saved > 0 && (
                    <Button variant="secondary" onClick={() => setMoving({ goal: g, direction: 'out' })}>
                      {t('goals.withdraw')}
                    </Button>
                  )}
                  <Button onClick={() => setMoving({ goal: g, direction: 'in' })}>
                    <Plus size={17} /> {t('goals.addMoney')}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <GoalSheet
        goal={adding ? 'new' : editing}
        onClose={() => {
          setEditing(null);
          onAddDone();
        }}
      />
      <GoalMoneySheet request={moving} onClose={() => setMoving(null)} />
    </>
  );
};

const GoalSheet = ({ goal, onClose }: { goal: Goal | 'new' | null; onClose: () => void }) => {
  const { data, dispatch, deleteGoal } = useStore();
  const existing = goal && goal !== 'new' ? goal : null;
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>(data.user!.baseCurrency);
  const [deadline, setDeadline] = useState('');
  const [color, setColor] = useState<WalletColor>('emerald');
  const [confirm, setConfirm] = useState(false);
  const [refundTo, setRefundTo] = useState<string>('');
  const saved = existing ? goalSaved(existing, data.transactions) : 0;

  useEffect(() => {
    if (!goal) return;
    setName(existing?.name ?? '');
    setTarget(existing ? String(existing.targetAmount) : '');
    setCurrency(existing?.currency ?? data.user!.baseCurrency);
    setDeadline(existing?.deadline ?? '');
    setColor(existing?.color ?? WALLET_COLORS[data.goals.length % WALLET_COLORS.length]);
    setRefundTo(data.wallets[0]?.id ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goal]);

  const value = parseAmount(target);
  const save = () => {
    if (!name.trim() || !(value > 0)) return;
    dispatch({
      type: 'upsertGoal',
      goal: {
        id: existing?.id ?? newId(),
        name: name.trim(),
        targetAmount: value,
        // A goal's currency can't change once money is in it.
        currency: saved > 0 && existing ? existing.currency : currency,
        deadline: deadline || undefined,
        color,
        openingAmount: existing?.openingAmount ?? 0,
        createdAt: existing?.createdAt ?? Date.now(),
      },
    });
    if (!existing) track('goal_created');
    onClose();
  };

  return (
    <Sheet
      open={!!goal}
      onClose={onClose}
      title={existing ? t('goals.edit') : t('goals.add')}
      footer={
        <div className="flex gap-3">
          {existing && (
            <Button variant="danger" onClick={() => setConfirm(true)}>
              {t('common.delete')}
            </Button>
          )}
          <Button block size="lg" onClick={save} disabled={!name.trim() || !(value > 0)}>
            {t('common.save')}
          </Button>
        </div>
      }
    >
      <div className="space-y-5 pt-2">
        <Field label={t('goals.name')}>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder={t('goals.namePlaceholder')} autoFocus={!existing} />
        </Field>
        <Field label={t('goals.target')}>
          <input inputMode="decimal" className={inputClass} value={target} onChange={(e) => setTarget(e.target.value)} placeholder="0" />
        </Field>
        <Field label={t('wallet.currency')}>
          <CurrencyField value={currency} onChange={setCurrency} disabled={saved > 0} />
        </Field>
        <Field label={t('goals.deadline')} hint={t('common.optional')}>
          <input type="date" className={inputClass} value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </Field>
        <Field label={t('wallets.color')}>
          <ColorPicker value={color} onChange={setColor} />
        </Field>
      </div>
      <ConfirmSheet
        open={confirm}
        danger
        title={t('goals.deleteTitle', { name: existing?.name ?? '' })}
        body={saved > 0 ? t('goals.deleteBodySaved', { amount: formatMoney(saved, existing?.currency ?? currency) }) : undefined}
        confirmLabel={t('common.delete')}
        onConfirm={() => {
          if (existing) deleteGoal(existing.id, saved > 0 ? refundTo || undefined : undefined);
          setConfirm(false);
          onClose();
        }}
        onClose={() => setConfirm(false)}
      >
        {saved > 0 && data.wallets.length > 0 && (
          <div className="mt-4">
            <Field label={t('goals.returnTo')}>
              <WalletChips wallets={data.wallets} value={refundTo} onChange={setRefundTo} />
            </Field>
            <button type="button" className="mt-3 text-sm text-faint underline" onClick={() => setRefundTo('')}>
              {refundTo ? t('goals.dontReturn') : t('goals.notReturning')}
            </button>
          </div>
        )}
      </ConfirmSheet>
    </Sheet>
  );
};

const GoalMoneySheet = ({ request, onClose }: { request: { goal: Goal; direction: 'in' | 'out' } | null; onClose: () => void }) => {
  const { data, fundGoal, withdrawGoal } = useStore();
  const toast = useToast();
  const [amount, setAmount] = useState('');
  const [walletId, setWalletId] = useState('');
  const balances = useMemo(() => walletBalances(data.wallets, data.transactions), [data.wallets, data.transactions]);

  useEffect(() => {
    if (!request) return;
    setAmount('');
    setWalletId(data.wallets[0]?.id ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request]);

  if (!request) return <Sheet open={false} onClose={onClose}>{null}</Sheet>;
  const { goal, direction } = request;
  const wallet = data.wallets.find((w) => w.id === walletId);
  const saved = goalSaved(goal, data.transactions);
  const value = parseAmount(amount);
  // Adding: typed in the wallet's currency. Withdrawing: typed in the goal's currency.
  const inputCurrency = direction === 'in' ? (wallet?.currency ?? goal.currency) : goal.currency;
  const tooMuch = direction === 'out' && value > saved + 1e-9;

  const submit = () => {
    if (!wallet || !(value > 0) || tooMuch) return;
    if (direction === 'in') {
      const { reached } = fundGoal(goal.id, wallet.id, value);
      toast({ message: reached ? t('goals.reachedToast', { goal: goal.name }) : t('goals.addedToast') });
    } else {
      withdrawGoal(goal.id, wallet.id, value);
      toast({ message: t('goals.withdrawnToast') });
    }
    onClose();
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title={direction === 'in' ? t('goals.addTo', { goal: goal.name }) : t('goals.withdrawFrom', { goal: goal.name })}
      footer={
        <Button block size="lg" onClick={submit} disabled={!(value > 0) || !wallet || tooMuch}>
          {direction === 'in' ? t('goals.addMoney') : t('goals.withdraw')}
        </Button>
      }
    >
      <div className="rounded-3xl border border-line bg-surface-2">
        <AmountInput value={amount} onChange={setAmount} currency={inputCurrency} label={t('editor.amount')} autoFocus />
        {direction === 'out' && <p className={cx('-mt-2 pb-3 text-center text-sm', tooMuch ? 'text-danger' : 'text-muted')}>{t('goals.available', { amount: formatMoney(saved, goal.currency) })}</p>}
      </div>
      <div className="mt-5">
        <Field label={direction === 'in' ? t('goals.fromWallet') : t('goals.returnTo')}>
          <WalletChips wallets={data.wallets} balances={balances} value={walletId} onChange={setWalletId} />
        </Field>
      </div>
    </Sheet>
  );
};

/* --------------------------------- Recurring -------------------------------- */

const Recurring = () => {
  const { data, dispatch } = useStore();
  const [deleting, setDeleting] = useState<RecurringRule | null>(null);
  const walletOf = new Map(data.wallets.map((w) => [w.id, w]));
  const rules = [...data.recurring].sort((a, b) => nextOccurrence(a) - nextOccurrence(b));

  if (rules.length === 0) {
    return <EmptyState icon={<CalendarClock size={26} />} title={t('recurring.empty')} body={t('recurring.emptyBody')} />;
  }
  return (
    <>
      <div className="space-y-3">
        {rules.map((r) => {
          const w = walletOf.get(r.walletId);
          const c = getCategory(r.categoryId);
          return (
            <Card key={r.id} className={cx(!r.active && 'opacity-60')}>
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-surface-2 text-xl">{c.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold text-ink">{r.note || categoryLabel(c)}</p>
                  <p className="truncate text-sm text-muted">
                    {frequencyLabel(r.frequency)} · {r.active ? t('recurring.next', { date: formatDate(nextOccurrence(r), 'short') }) : t('recurring.paused')}
                  </p>
                </div>
                <span className={cx('tabular text-[15px] font-semibold', r.type === 'income' ? 'text-income' : 'text-ink')}>
                  {r.type === 'income' ? '+' : '−'}
                  {formatMoney(r.amount, w?.currency ?? 'USD')}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                <label className="flex items-center gap-3 text-sm text-muted">
                  <Toggle
                    checked={r.active}
                    label={t('recurring.active')}
                    onChange={(active) => {
                      // Resuming skips the paused period instead of back-filling it.
                      let rule = { ...r, active };
                      if (active) while (nextOccurrence(rule) < Date.now()) rule = { ...rule, occurrences: rule.occurrences + 1 };
                      dispatch({ type: 'upsertRecurring', rule });
                    }}
                  />
                  {t('recurring.active')}
                </label>
                <IconButton label={t('common.delete')} onClick={() => setDeleting(r)} className="size-9 bg-transparent border-0 text-faint">
                  <Trash2 size={18} />
                </IconButton>
              </div>
            </Card>
          );
        })}
      </div>
      <ConfirmSheet
        open={!!deleting}
        danger
        title={t('recurring.deleteTitle')}
        body={t('recurring.deleteBody')}
        confirmLabel={t('common.delete')}
        onConfirm={() => {
          if (deleting) dispatch({ type: 'deleteRecurring', id: deleting.id });
          setDeleting(null);
        }}
        onClose={() => setDeleting(null)}
      />
    </>
  );
};
