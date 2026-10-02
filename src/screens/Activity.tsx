import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, ReceiptText, Search, X } from 'lucide-react';
import { getCategory } from '../domain/categories';
import { dayRange, monthRange } from '../domain/dates';
import { isInternal, sortByDateDesc, summarize } from '../domain/ledger';
import { formatMoney } from '../domain/money';
import type { Transaction } from '../domain/types';
import { categoryLabel, formatDate, t } from '../i18n';
import { useNav } from '../state/nav';
import { useStore } from '../state/store';
import { Card, Chip, EmptyState, IconButton, inputClass, ListGroup, ScreenHeader, cx } from '../ui/kit';
import { TransactionRow } from '../ui/TransactionRow';
import { ExportSheet } from './ExportSheet';

type Filter = 'all' | 'expense' | 'income';

export const Activity = () => {
  const { data, rates } = useStore();
  const nav = useNav();
  const base = data.user!.baseCurrency;
  const [offset, setOffset] = useState(0);
  const [filter, setFilter] = useState<Filter>('all');
  const [walletId, setWalletId] = useState<string>('');
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const range = useMemo(() => monthRange(Date.now(), offset), [offset]);
  const walletOf = useMemo(() => new Map(data.wallets.map((w) => [w.id, w])), [data.wallets]);
  const summary = useMemo(
    () => summarize(data.transactions, data.wallets, base, rates, range, walletId || undefined),
    [data.transactions, data.wallets, base, rates, range, walletId],
  );

  const q = query.trim().toLowerCase();
  const matches = (tx: Transaction) => {
    if (walletId && tx.walletId !== walletId) return false;
    if (filter !== 'all' && (tx.type !== filter || isInternal(tx))) return false;
    if (!q) return true;
    const cat = categoryLabel(getCategory(tx.categoryId)).toLowerCase();
    return (
      cat.includes(q) ||
      tx.note.toLowerCase().includes(q) ||
      tx.tags.some((tag) => tag.toLowerCase().includes(q)) ||
      String(tx.amount).includes(q)
    );
  };

  // Searching looks across all months; browsing shows one month at a time.
  const list = useMemo(
    () =>
      data.transactions
        .filter((tx) => (q ? true : tx.date >= range.start && tx.date < range.end))
        .filter(matches)
        .sort(sortByDateDesc),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data.transactions, range, q, filter, walletId],
  );

  const groups = useMemo(() => {
    const out: { day: number; items: Transaction[] }[] = [];
    for (const tx of list) {
      const day = dayRange(tx.date).start;
      const last = out[out.length - 1];
      if (last && last.day === day) last.items.push(tx);
      else out.push({ day, items: [tx] });
    }
    return out;
  }, [list]);

  return (
    <div className="animate-in fade-in duration-300">
      <ScreenHeader
        title={t('activity.title')}
        actions={
          <>
            <IconButton label={t('activity.search')} onClick={() => setSearching((s) => !s)}>
              {searching ? <X size={20} /> : <Search size={20} />}
            </IconButton>
            <IconButton label={t('export.title')} onClick={() => setExportOpen(true)}>
              <Download size={20} />
            </IconButton>
          </>
        }
      />

      {searching && (
        <div className="relative mb-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <Search size={18} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-faint" />
          <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('activity.searchPlaceholder')} className={cx(inputClass, 'ps-11')} />
        </div>
      )}

      {!q && (
        <Card className="mb-4 p-3">
          <div className="flex items-center justify-between">
            <IconButton label={t('activity.prevMonth')} onClick={() => setOffset((o) => o - 1)} className="bg-transparent border-0">
              <ChevronLeft size={22} className="rtl:rotate-180" />
            </IconButton>
            <span className="text-base font-semibold text-ink">{formatDate(range.start, 'month')}</span>
            <IconButton label={t('activity.nextMonth')} disabled={offset >= 0} onClick={() => setOffset((o) => o + 1)} className="bg-transparent border-0 disabled:opacity-30">
              <ChevronRight size={22} className="rtl:rotate-180" />
            </IconButton>
          </div>
          <div className="mt-2 grid grid-cols-3 divide-x divide-line rtl:divide-x-reverse text-center">
            <div>
              <p className="text-xs text-muted">{t('common.income')}</p>
              <p className="tabular text-[15px] font-semibold text-income">{formatMoney(summary.income, base, { compact: true })}</p>
            </div>
            <div>
              <p className="text-xs text-muted">{t('common.spent')}</p>
              <p className="tabular text-[15px] font-semibold text-expense">{formatMoney(summary.expense, base, { compact: true })}</p>
            </div>
            <div>
              <p className="text-xs text-muted">{t('common.net')}</p>
              <p className={cx('tabular text-[15px] font-semibold', summary.net >= 0 ? 'text-ink' : 'text-danger')}>
                {formatMoney(summary.net, base, { compact: true, signed: true })}
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="-mx-5 mb-4 flex gap-2 overflow-x-auto px-5">
        {(['all', 'expense', 'income'] as Filter[]).map((f) => (
          <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
            {t(`activity.filter.${f}`)}
          </Chip>
        ))}
        {data.wallets.length > 1 && <span className="mx-1 w-px shrink-0 bg-line" />}
        {data.wallets.length > 1 &&
          data.wallets.map((w) => (
            <Chip key={w.id} active={walletId === w.id} onClick={() => setWalletId(walletId === w.id ? '' : w.id)}>
              {w.name}
            </Chip>
          ))}
      </div>

      {groups.length === 0 ? (
        <EmptyState icon={<ReceiptText size={26} />} title={q ? t('activity.noResults') : t('activity.empty')} body={q ? undefined : t('activity.emptyBody')} />
      ) : (
        <div className="space-y-5">
          {groups.map((g) => (
            <section key={g.day}>
              <h3 className="mb-2 px-1 text-sm font-medium text-muted">{formatDate(g.day, q ? 'day' : 'weekday')}</h3>
              <ListGroup>
                {g.items.map((tx) => (
                  <TransactionRow key={tx.id} tx={tx} wallet={walletOf.get(tx.walletId)} onClick={() => nav.openTransaction(tx)} />
                ))}
              </ListGroup>
            </section>
          ))}
        </div>
      )}

      <ExportSheet open={exportOpen} onClose={() => setExportOpen(false)} defaultRange={range} />
    </div>
  );
};
