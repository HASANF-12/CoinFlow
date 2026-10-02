import { ArrowLeftRight, Paperclip, Repeat, Target } from 'lucide-react';
import { getCategory } from '../domain/categories';
import { formatMoney } from '../domain/money';
import type { Transaction, Wallet } from '../domain/types';
import { categoryLabel, formatDate, t } from '../i18n';
import { cx } from './kit';

export const txTitle = (tx: Transaction) => {
  if (tx.transferId) return tx.type === 'expense' ? t('tx.transferOut') : t('tx.transferIn');
  if (tx.goalId) return tx.type === 'expense' ? t('tx.toGoal', { goal: tx.note }) : t('tx.fromGoal', { goal: tx.note });
  return categoryLabel(getCategory(tx.categoryId));
};

export const TransactionRow = ({
  tx,
  wallet,
  onClick,
  showDate,
}: {
  tx: Transaction;
  wallet?: Wallet;
  onClick?: () => void;
  showDate?: boolean;
}) => {
  const cat = getCategory(tx.categoryId);
  const internal = !!tx.transferId || !!tx.goalId;
  const note = tx.goalId ? '' : tx.note;
  const sub = [wallet?.name, showDate ? formatDate(tx.date, 'short') : null].filter(Boolean).join(' · ');
  return (
    <button type="button" onClick={onClick} className="press flex w-full items-center gap-3 px-4 py-3 text-start">
      <span className={cx('relative grid size-11 shrink-0 place-items-center rounded-2xl text-xl', internal ? 'bg-surface-3 text-muted' : 'bg-surface-2')}>
        {tx.transferId ? <ArrowLeftRight size={18} /> : tx.goalId ? <Target size={18} /> : cat.icon}
        {tx.recurringId && (
          <span className="absolute -bottom-1 -end-1 grid size-5 place-items-center rounded-full border-2 border-surface bg-brand text-brand-ink">
            <Repeat size={10} strokeWidth={3} />
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-[15px] font-medium text-ink">{txTitle(tx)}</span>
          {tx.receipt && <Paperclip size={13} className="shrink-0 text-faint" aria-label={t('tx.hasReceipt')} />}
        </span>
        <span className="block truncate text-sm text-muted">{note ? `${note}${sub ? ' · ' : ''}${sub}` : sub}</span>
      </span>
      <span className={cx('tabular shrink-0 text-[15px] font-semibold', internal ? 'text-muted' : tx.type === 'income' ? 'text-income' : 'text-ink')}>
        {tx.type === 'income' ? '+' : '−'}
        {formatMoney(tx.amount, wallet?.currency ?? 'USD')}
      </span>
    </button>
  );
};
