import { forwardRef } from 'react';
import { Home, List, Plus, Target, Wallet } from 'lucide-react';
import { t } from '../i18n';
import type { Tab } from '../state/nav';
import { cx } from './kit';

const ITEMS: { tab: Tab; icon: typeof Home; label: () => string }[] = [
  { tab: 'home', icon: Home, label: () => t('nav.home') },
  { tab: 'activity', icon: List, label: () => t('nav.activity') },
  { tab: 'plan', icon: Target, label: () => t('nav.plan') },
  { tab: 'wallets', icon: Wallet, label: () => t('nav.wallets') },
];

export const BottomNav = forwardRef<HTMLElement, { tab: Tab; onTab: (t: Tab) => void; onAdd: () => void }>(({ tab, onTab, onAdd }, ref) => {
  const button = (item: (typeof ITEMS)[number]) => {
    const active = tab === item.tab;
    const Icon = item.icon;
    return (
      <button
        key={item.tab}
        type="button"
        onClick={() => onTab(item.tab)}
        aria-current={active ? 'page' : undefined}
        className={cx('press flex flex-1 flex-col items-center gap-1 pt-2', active ? 'text-brand' : 'text-faint')}
      >
        <Icon size={23} strokeWidth={active ? 2.4 : 2} />
        <span className={cx('text-xs', active ? 'font-semibold' : 'font-medium')}>{item.label()}</span>
      </button>
    );
  };
  return (
    <nav ref={ref} className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 backdrop-blur-lg" style={{ paddingBottom: 'var(--sab)' }}>
      <div className="mx-auto flex h-[var(--nav-h)] max-w-lg items-start px-2">
        {ITEMS.slice(0, 2).map(button)}
        <div className="flex flex-1 justify-center">
          <button
            type="button"
            onClick={onAdd}
            aria-label={t('nav.add')}
            className="press -mt-5 grid size-15 place-items-center rounded-full bg-brand text-brand-ink shadow-lg shadow-brand/30"
          >
            <Plus size={30} strokeWidth={2.6} />
          </button>
        </div>
        {ITEMS.slice(2).map(button)}
      </div>
    </nav>
  );
});
