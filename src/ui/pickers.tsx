import { useMemo, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { pickableCategories } from '../domain/categories';
import { CURRENCIES, CURRENCY_CODES, type CurrencyCode } from '../domain/currencies';
import { formatMoney } from '../domain/money';
import type { TxType, Wallet, WalletColor } from '../domain/types';
import { categoryLabel, t } from '../i18n';
import { Sheet } from './Sheet';
import { cx, inputClass } from './kit';

export const WALLET_GRADIENTS: Record<WalletColor, string> = {
  emerald: 'linear-gradient(135deg, #1fa688, #0b5546)',
  blue: 'linear-gradient(135deg, #3b82f6, #1e2f7a)',
  rose: 'linear-gradient(135deg, #f43f5e, #9a3412)',
  purple: 'linear-gradient(135deg, #8b5cf6, #3b1f7a)',
  slate: 'linear-gradient(135deg, #52606d, #1f2933)',
  teal: 'linear-gradient(135deg, #14b8a6, #155e75)',
  amber: 'linear-gradient(135deg, #f59e0b, #92400e)',
  sky: 'linear-gradient(135deg, #38bdf8, #0c4a6e)',
};
export const WALLET_COLORS = Object.keys(WALLET_GRADIENTS) as WalletColor[];

export const ColorPicker = ({ value, onChange }: { value: WalletColor; onChange: (c: WalletColor) => void }) => (
  <div className="flex flex-wrap gap-3">
    {WALLET_COLORS.map((c) => (
      <button
        key={c}
        type="button"
        aria-label={c}
        aria-pressed={value === c}
        onClick={() => onChange(c)}
        className={cx('press grid size-10 place-items-center rounded-full ring-offset-2 ring-offset-surface', value === c && 'ring-2 ring-ink')}
        style={{ background: WALLET_GRADIENTS[c] }}
      >
        {value === c && <Check size={18} className="text-white" />}
      </button>
    ))}
  </div>
);

export const currencyName = (code: CurrencyCode) => `${code} · ${CURRENCIES[code].name}`;

export const CurrencyField = ({ value, onChange, disabled }: { value: CurrencyCode; onChange: (c: CurrencyCode) => void; disabled?: boolean }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" disabled={disabled} onClick={() => setOpen(true)} className={cx(inputClass, 'press flex items-center justify-between text-start disabled:opacity-50')}>
        <span className="truncate">
          {currencyName(value)} <span className="text-faint">· {CURRENCIES[value].country}</span>
        </span>
        <ChevronDown size={18} className="shrink-0 text-faint" />
      </button>
      <CurrencyPicker
        open={open}
        value={value}
        onClose={() => setOpen(false)}
        onPick={(c) => {
          onChange(c);
          setOpen(false);
        }}
      />
    </>
  );
};

const POPULAR: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'SAR', 'AED', 'EGP', 'INR', 'NGN', 'BRL', 'MXN', 'TRY', 'IDR', 'PKR', 'LBP'];

export const CurrencyPicker = ({
  open,
  value,
  onPick,
  onClose,
}: {
  open: boolean;
  value: CurrencyCode;
  onPick: (c: CurrencyCode) => void;
  onClose: () => void;
}) => {
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [...POPULAR, ...CURRENCY_CODES.filter((c) => !POPULAR.includes(c))];
    return CURRENCY_CODES.filter((c) => {
      const d = CURRENCIES[c];
      return c.toLowerCase().includes(query) || d.name.toLowerCase().includes(query) || d.country.toLowerCase().includes(query);
    });
  }, [q]);
  return (
    <Sheet open={open} onClose={onClose} title={t('currency.pick')}>
      <div className="sticky top-0 z-10 bg-surface pb-3">
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-faint" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('currency.search')} className={cx(inputClass, 'ps-11')} />
        </div>
      </div>
      <div className="divide-y divide-line">
        {list.map((c) => (
          <button key={c} type="button" onClick={() => onPick(c)} className="press flex w-full items-center gap-3 py-3 text-start">
            <span className="grid h-9 w-14 shrink-0 place-items-center rounded-lg bg-surface-2 text-sm font-bold text-ink">{c}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] text-ink">{CURRENCIES[c].name}</span>
              <span className="block truncate text-sm text-muted">{CURRENCIES[c].country}</span>
            </span>
            {c === value && <Check size={18} className="text-brand" />}
          </button>
        ))}
        {list.length === 0 && <p className="py-8 text-center text-muted">{t('currency.none')}</p>}
      </div>
    </Sheet>
  );
};

export const WalletChips = ({
  wallets,
  balances,
  value,
  onChange,
  exclude,
}: {
  wallets: Wallet[];
  balances?: Map<string, number>;
  value: string;
  onChange: (id: string) => void;
  exclude?: string;
}) => (
  <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
    {wallets
      .filter((w) => w.id !== exclude)
      .map((w) => {
        const active = w.id === value;
        return (
          <button
            key={w.id}
            type="button"
            onClick={() => onChange(w.id)}
            aria-pressed={active}
            className={cx('press flex shrink-0 items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-start', active ? 'border-brand bg-brand-soft' : 'border-line bg-surface-2')}
          >
            <span className="size-7 shrink-0 rounded-lg" style={{ background: WALLET_GRADIENTS[w.color] }} />
            <span>
              <span className="block max-w-32 truncate text-sm font-semibold text-ink">{w.name}</span>
              {balances && <span className="block text-xs text-muted tabular">{formatMoney(balances.get(w.id) ?? 0, w.currency)}</span>}
            </span>
          </button>
        );
      })}
  </div>
);

export const CategoryGrid = ({ type, value, onChange }: { type: TxType; value: string; onChange: (id: string) => void }) => (
  <div className="grid grid-cols-4 gap-2">
    {pickableCategories(type).map((c) => {
      const active = c.id === value;
      return (
        <button
          key={c.id}
          type="button"
          aria-pressed={active}
          onClick={() => onChange(c.id)}
          className={cx('press flex flex-col items-center gap-1 rounded-2xl border px-1 py-2.5', active ? 'border-brand bg-brand-soft' : 'border-transparent bg-surface-2')}
        >
          <span className="text-2xl leading-none">{c.icon}</span>
          <span className={cx('w-full truncate text-center text-xs', active ? 'font-semibold text-ink' : 'text-muted')}>{categoryLabel(c)}</span>
        </button>
      );
    })}
  </div>
);
