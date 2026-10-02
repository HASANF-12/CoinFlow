import { useMemo } from 'react';
import { ArrowDownLeft, ArrowUpRight, Plus, Settings as SettingsIcon, Sparkles } from 'lucide-react';
import { getCategory } from '../domain/categories';
import { monthRange } from '../domain/dates';
import { budgetSpent, sortByDateDesc, summarize, totalIn } from '../domain/ledger';
import { formatMoney } from '../domain/money';
import { categoryLabel, formatDate, t } from '../i18n';
import { useNav } from '../state/nav';
import { useStore } from '../state/store';
import { Button, Card, cx, EmptyState, IconButton, ListGroup, Progress, SectionTitle } from '../ui/kit';
import { WALLET_GRADIENTS } from '../ui/pickers';
import { TransactionRow } from '../ui/TransactionRow';

const greetingKey = () => {
  const h = new Date().getHours();
  return h < 12 ? 'home.greeting.morning' : h < 18 ? 'home.greeting.afternoon' : 'home.greeting.evening';
};

export const Home = () => {
  const { data, balances, rates } = useStore();
  const nav = useNav();
  const user = data.user!;
  const base = user.baseCurrency;
  const range = useMemo(() => monthRange(Date.now()), []);

  const total = useMemo(() => totalIn(data.wallets, balances, base, rates), [data.wallets, balances, base, rates]);
  const month = useMemo(() => summarize(data.transactions, data.wallets, base, rates, range), [data.transactions, data.wallets, base, rates, range]);
  const recent = useMemo(() => [...data.transactions].sort(sortByDateDesc).slice(0, 5), [data.transactions]);
  const walletOf = useMemo(() => new Map(data.wallets.map((w) => [w.id, w])), [data.wallets]);
  const budgets = useMemo(
    () =>
      data.budgets
        .map((b) => ({ b, spent: budgetSpent(b, data.transactions, data.wallets, rates, range) }))
        .sort((x, y) => y.spent / y.b.limit - x.spent / x.b.limit)
        .slice(0, 3),
    [data.budgets, data.transactions, data.wallets, rates, range],
  );
  const hasActivity = data.transactions.length > 0;
  const maxCat = month.byCategory[0]?.amount ?? 1;

  return (
    <div className="animate-in fade-in duration-300">
      <header className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">{t(greetingKey())}</p>
          <h1 className="text-2xl font-bold tracking-tight text-ink">{user.name || t('home.title')}</h1>
        </div>
        <IconButton label={t('settings.title')} onClick={() => nav.go('settings')}>
          <SettingsIcon size={20} />
        </IconButton>
      </header>

      <Card onClick={() => nav.go('wallets')} className="relative overflow-hidden bg-gradient-to-br from-brand/25 via-surface to-surface p-5">
        <p className="text-sm font-medium text-muted">{t('home.totalBalance')}</p>
        <p className="tabular mt-1 text-4xl font-bold tracking-tight text-ink">{formatMoney(total, base)}</p>
        <div className="mt-4 flex gap-2">
          <span className="tabular inline-flex items-center gap-1 rounded-full bg-income/12 px-3 py-1 text-sm font-medium text-income">
            <ArrowDownLeft size={15} /> {formatMoney(month.income, base, { compact: true })}
          </span>
          <span className="tabular inline-flex items-center gap-1 rounded-full bg-expense/12 px-3 py-1 text-sm font-medium text-expense">
            <ArrowUpRight size={15} /> {formatMoney(month.expense, base, { compact: true })}
          </span>
          <span className="ms-auto self-center text-xs text-faint">{formatDate(Date.now(), 'month')}</span>
        </div>
      </Card>

      {data.wallets.length > 1 && (
        <div className="-mx-5 mt-4 flex gap-3 overflow-x-auto px-5">
          {data.wallets.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => nav.go('wallets')}
              className="press w-40 shrink-0 rounded-2xl p-3 text-start text-white"
              style={{ background: WALLET_GRADIENTS[w.color] }}
            >
              <span className="block truncate text-sm font-medium opacity-90">{w.name}</span>
              <span className="tabular mt-1 block truncate text-base font-bold">{formatMoney(balances.get(w.id) ?? 0, w.currency)}</span>
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Button variant="secondary" size="lg" onClick={() => nav.openEditor({ mode: 'expense' })}>
          <ArrowUpRight size={18} className="text-expense" /> {t('home.addExpense')}
        </Button>
        <Button variant="secondary" size="lg" onClick={() => nav.openEditor({ mode: 'income' })}>
          <ArrowDownLeft size={18} className="text-income" /> {t('home.addIncome')}
        </Button>
      </div>

      {!hasActivity ? (
        <div className="mt-8">
          <EmptyState
            icon={<Sparkles size={26} />}
            title={t('home.empty.title')}
            body={t('home.empty.body')}
            action={
              <Button onClick={() => nav.openEditor({ mode: 'expense' })}>
                <Plus size={18} /> {t('home.empty.cta')}
              </Button>
            }
          />
        </div>
      ) : (
        <>
          {month.byCategory.length > 0 && (
            <>
              <SectionTitle
                action={
                  <button type="button" className="text-sm font-medium text-brand" onClick={() => nav.go('activity')}>
                    {t('common.seeAll')}
                  </button>
                }
              >
                {t('home.spending')}
              </SectionTitle>
              <Card>
                <div className="space-y-4">
                  {month.byCategory.slice(0, 5).map(({ categoryId, amount }) => {
                    const c = getCategory(categoryId);
                    return (
                      <div key={categoryId} className="flex items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-lg">{c.icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1.5 flex justify-between gap-2 text-sm">
                            <span className="truncate font-medium text-ink">{categoryLabel(c)}</span>
                            <span className="tabular shrink-0 text-muted">
                              {formatMoney(amount, base)} · {Math.round((amount / month.expense) * 100)}%
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
                            <div className="h-full rounded-full" style={{ width: `${(amount / maxCat) * 100}%`, background: c.color }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </>
          )}

          {budgets.length > 0 && (
            <>
              <SectionTitle
                action={
                  <button type="button" className="text-sm font-medium text-brand" onClick={() => nav.go('plan', 'budgets')}>
                    {t('common.seeAll')}
                  </button>
                }
              >
                {t('home.budgets')}
              </SectionTitle>
              <Card>
                <div className="space-y-4">
                  {budgets.map(({ b, spent }) => {
                    const ratio = spent / b.limit;
                    const c = getCategory(b.categoryId);
                    return (
                      <div key={b.id}>
                        <div className="mb-1.5 flex justify-between text-sm">
                          <span className="font-medium text-ink">
                            {c.icon} {categoryLabel(c)}
                          </span>
                          <span className={cx('tabular', ratio >= 1 ? 'text-danger' : 'text-muted')}>
                            {formatMoney(spent, b.currency)} / {formatMoney(b.limit, b.currency)}
                          </span>
                        </div>
                        <Progress value={ratio} tone={ratio >= 1 ? 'danger' : ratio >= 0.8 ? 'warn' : 'brand'} />
                      </div>
                    );
                  })}
                </div>
              </Card>
            </>
          )}

          <SectionTitle
            action={
              <button type="button" className="text-sm font-medium text-brand" onClick={() => nav.go('activity')}>
                {t('common.seeAll')}
              </button>
            }
          >
            {t('home.recent')}
          </SectionTitle>
          <ListGroup>
            {recent.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} wallet={walletOf.get(tx.walletId)} showDate onClick={() => nav.openTransaction(tx)} />
            ))}
          </ListGroup>
        </>
      )}
    </div>
  );
};
