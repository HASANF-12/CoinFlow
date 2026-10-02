import type { CurrencyCode } from '../domain/currencies';
import { cx } from './kit';

/** Large centred amount entry. Keeps the raw text; callers parse with parseAmount on save. */
export const AmountInput = ({
  value,
  onChange,
  currency,
  tone,
  autoFocus,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  currency: CurrencyCode;
  tone?: 'income' | 'expense';
  autoFocus?: boolean;
  label: string;
}) => (
  <div className="flex flex-col items-center gap-1 py-4">
    <span className="rounded-full bg-surface-3 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-muted">{currency}</span>
    <input
      aria-label={label}
      inputMode="decimal"
      autoFocus={autoFocus}
      placeholder="0"
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/[^\d.,٠-٩٫٬]/g, ''))}
      className={cx(
        'tabular w-full bg-transparent text-center text-5xl font-bold outline-none placeholder:text-surface-3',
        tone === 'income' ? 'text-income' : 'text-ink',
      )}
    />
  </div>
);
