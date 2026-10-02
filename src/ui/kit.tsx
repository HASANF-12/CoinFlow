import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

export const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ');

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

export const Button = ({
  variant = 'primary',
  size = 'md',
  block,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'md' | 'lg'; block?: boolean }) => (
  <button
    type="button"
    {...rest}
    className={cx(
      'press inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl font-semibold disabled:opacity-40 disabled:active:scale-100',
      size === 'lg' ? 'h-14 px-6 text-base' : 'h-11 px-4 text-[15px]',
      block && 'w-full',
      variant === 'primary' && 'bg-brand text-brand-ink',
      variant === 'secondary' && 'bg-surface-2 text-ink border border-line',
      variant === 'ghost' && 'text-muted hover:text-ink',
      variant === 'danger' && 'bg-danger/15 text-danger',
      className,
    )}
  >
    {children}
  </button>
);

export const IconButton = ({ label, className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    {...rest}
    className={cx('press grid size-11 place-items-center rounded-full bg-surface-2 text-ink border border-line', className)}
  >
    {children}
  </button>
);

export const Card = ({ className, children, onClick }: { className?: string; children: ReactNode; onClick?: () => void }) =>
  onClick ? (
    <button type="button" onClick={onClick} className={cx('press block w-full text-start rounded-3xl bg-surface border border-line p-4', className)}>
      {children}
    </button>
  ) : (
    <div className={cx('rounded-3xl bg-surface border border-line p-4', className)}>{children}</div>
  );

export const SectionTitle = ({ children, action }: { children: ReactNode; action?: ReactNode }) => (
  <div className="mb-3 mt-7 flex items-center justify-between px-1">
    <h2 className="text-[15px] font-semibold text-ink">{children}</h2>
    {action}
  </div>
);

export const ScreenHeader = ({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) => (
  <header className="mb-5 flex items-start justify-between gap-3">
    <div className="min-w-0">
      <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
      {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
    </div>
    {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
  </header>
);

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  className,
}: {
  value: T;
  options: { value: T; label: string; tone?: 'income' | 'expense' }[];
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div role="tablist" className={cx('flex rounded-2xl bg-surface-2 p-1 border border-line', className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cx(
              'press flex-1 rounded-xl py-2.5 text-sm font-semibold',
              active
                ? o.tone === 'expense'
                  ? 'bg-expense text-[#2a0a0f]'
                  : o.tone === 'income'
                    ? 'bg-income text-[#04210f]'
                    : 'bg-ink text-bg'
                : 'text-muted',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
    className={cx('relative h-7 w-12 shrink-0 rounded-full transition-colors', checked ? 'bg-brand' : 'bg-surface-3')}
  >
    <span className={cx('absolute top-1 size-5 rounded-full bg-white shadow transition-all', checked ? 'start-6' : 'start-1')} />
  </button>
);

export const Field = ({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) => (
  <label className="block">
    <span className="mb-1.5 block px-1 text-sm font-medium text-muted">{label}</span>
    {children}
    {hint && <span className="mt-1.5 block px-1 text-xs text-faint">{hint}</span>}
  </label>
);

export const inputClass =
  'w-full rounded-2xl border border-line bg-surface-2 px-4 py-3.5 text-ink outline-none placeholder:text-faint focus:border-brand';

export const ListRow = ({
  icon,
  title,
  subtitle,
  trailing,
  onClick,
  danger,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  onClick?: () => void;
  danger?: boolean;
}) => {
  const body = (
    <>
      {icon && <span className={cx('grid size-10 shrink-0 place-items-center rounded-xl', danger ? 'bg-danger/15 text-danger' : 'bg-surface-3 text-ink')}>{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className={cx('block truncate text-[15px] font-medium', danger ? 'text-danger' : 'text-ink')}>{title}</span>
        {subtitle && <span className="block truncate text-sm text-muted">{subtitle}</span>}
      </span>
      {trailing ?? (onClick && <ChevronRight size={18} className="shrink-0 text-faint rtl:rotate-180" />)}
    </>
  );
  return onClick ? (
    <button type="button" onClick={onClick} className="press flex w-full items-center gap-3 px-4 py-3 text-start">
      {body}
    </button>
  ) : (
    <div className="flex items-center gap-3 px-4 py-3">{body}</div>
  );
};

export const ListGroup = ({ children }: { children: ReactNode }) => (
  <div className="overflow-hidden rounded-3xl border border-line bg-surface divide-y divide-line">{children}</div>
);

export const EmptyState = ({ icon, title, body, action }: { icon: ReactNode; title: string; body?: string; action?: ReactNode }) => (
  <div className="flex flex-col items-center rounded-3xl border border-dashed border-line px-6 py-10 text-center">
    <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-brand-soft text-brand">{icon}</div>
    <p className="text-base font-semibold text-ink">{title}</p>
    {body && <p className="mt-1 max-w-xs text-sm text-muted">{body}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export const Progress = ({ value, tone = 'brand' }: { value: number; tone?: 'brand' | 'warn' | 'danger' | 'income' }) => (
  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-3" role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
    <div
      className={cx(
        'h-full rounded-full transition-[width] duration-500',
        tone === 'brand' && 'bg-brand',
        tone === 'warn' && 'bg-warn',
        tone === 'danger' && 'bg-danger',
        tone === 'income' && 'bg-income',
      )}
      style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }}
    />
  </div>
);

export const Chip = ({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    className={cx(
      'press shrink-0 rounded-full border px-3.5 py-2 text-sm font-medium',
      active ? 'border-brand bg-brand-soft text-ink' : 'border-line bg-surface-2 text-muted',
    )}
  >
    {children}
  </button>
);
