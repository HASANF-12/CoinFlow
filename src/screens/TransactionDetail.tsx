import { useEffect, useState } from 'react';
import { Copy, Pencil, Repeat, Trash2 } from 'lucide-react';
import { getCategory } from '../domain/categories';
import { formatMoney } from '../domain/money';
import type { Transaction } from '../domain/types';
import { categoryLabel, formatDate, frequencyLabel, t } from '../i18n';
import { receiptSrc } from '../services/receipts';
import { useNav } from '../state/nav';
import { useStore } from '../state/store';
import { Button, cx } from '../ui/kit';
import { Sheet } from '../ui/Sheet';
import { useToast } from '../ui/Toast';
import { txTitle } from '../ui/TransactionRow';

export const TransactionDetail = ({ tx, onClose }: { tx: Transaction | null; onClose: () => void }) => {
  const { data, deleteTransaction, restoreTransactions, purgeReceipts } = useStore();
  const nav = useNav();
  const toast = useToast();
  const [src, setSrc] = useState('');
  const [zoom, setZoom] = useState(false);

  // Always show the latest version (e.g. after an edit).
  const current = tx ? (data.transactions.find((x) => x.id === tx.id) ?? tx) : null;

  useEffect(() => {
    let alive = true;
    setSrc('');
    if (current?.receipt) void receiptSrc(current.receipt).then((s) => alive && setSrc(s));
    return () => {
      alive = false;
    };
  }, [current?.receipt]);

  if (!current) return <Sheet open={false} onClose={onClose}>{null}</Sheet>;

  const wallet = data.wallets.find((w) => w.id === current.walletId);
  const rule = current.recurringId ? data.recurring.find((r) => r.id === current.recurringId) : undefined;
  const internal = !!current.transferId || !!current.goalId;
  const counterpart = current.transferId ? data.transactions.find((x) => x.transferId === current.transferId && x.id !== current.id) : undefined;
  const counterWallet = counterpart ? data.wallets.find((w) => w.id === counterpart.walletId) : undefined;

  const remove = () => {
    const removed = deleteTransaction(current.id);
    onClose();
    toast({
      message: t('detail.deleted'),
      action: { label: t('common.undo'), run: () => restoreTransactions(removed) },
      onExpire: () => purgeReceipts(removed),
    });
  };

  const rows: [string, string][] = [
    [t('detail.wallet'), wallet?.name ?? '—'],
    ...(counterpart && counterWallet
      ? [[current.type === 'expense' ? t('detail.to') : t('detail.from'), `${counterWallet.name} (${formatMoney(counterpart.amount, counterWallet.currency)})`] as [string, string]]
      : []),
    ...(!internal ? [[t('detail.category'), `${getCategory(current.categoryId).icon} ${categoryLabel(getCategory(current.categoryId))}`] as [string, string]] : []),
    [t('detail.date'), `${formatDate(current.date, 'day')} · ${formatDate(current.date, 'time')}`],
    ...(current.note && !current.goalId ? [[t('detail.note'), current.note] as [string, string]] : []),
    ...(current.tags.length ? [[t('detail.tags'), current.tags.map((x) => `#${x}`).join(' ')] as [string, string]] : []),
  ];

  return (
    <Sheet open onClose={onClose}>
      <div className="pt-4 text-center">
        <p className="text-sm font-medium text-muted">{txTitle(current)}</p>
        <p className={cx('tabular mt-1 text-4xl font-bold', internal ? 'text-ink' : current.type === 'income' ? 'text-income' : 'text-ink')}>
          {current.type === 'income' ? '+' : '−'}
          {formatMoney(current.amount, wallet?.currency ?? 'USD')}
        </p>
        {rule && (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-sm text-brand">
            <Repeat size={14} /> {t('detail.repeats', { frequency: frequencyLabel(rule.frequency).toLowerCase() })}
          </p>
        )}
      </div>

      <dl className="mt-6 divide-y divide-line rounded-3xl border border-line bg-surface-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 px-4 py-3">
            <dt className="text-[15px] text-muted">{k}</dt>
            <dd className="text-end text-[15px] text-ink">{v}</dd>
          </div>
        ))}
      </dl>

      {src && (
        <button type="button" onClick={() => setZoom(true)} className="press mt-4 block w-full overflow-hidden rounded-2xl border border-line">
          <img src={src} alt={t('editor.receipt')} className="max-h-60 w-full object-cover" />
        </button>
      )}

      <div className={cx('mt-6 grid gap-3', internal ? 'grid-cols-1' : 'grid-cols-3')}>
        {!internal && (
          <>
            <Button
              variant="secondary"
              onClick={() => {
                onClose();
                nav.openEditor({ tx: current });
              }}
            >
              <Pencil size={17} /> {t('common.edit')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                onClose();
                nav.openEditor({ copyOf: current });
              }}
            >
              <Copy size={17} /> {t('detail.again')}
            </Button>
          </>
        )}
        <Button variant="danger" onClick={remove}>
          <Trash2 size={17} /> {t('common.delete')}
        </Button>
      </div>
      {current.transferId && <p className="mt-3 text-center text-xs text-faint">{t('detail.transferDeleteHint')}</p>}

      <Sheet open={zoom} onClose={() => setZoom(false)} full>
        <button type="button" className="flex h-full w-full items-center justify-center" onClick={() => setZoom(false)}>
          <img src={src} alt={t('editor.receipt')} className="max-h-full max-w-full object-contain" />
        </button>
      </Sheet>
    </Sheet>
  );
};
