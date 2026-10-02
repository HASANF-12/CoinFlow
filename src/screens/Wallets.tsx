import { useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, Plus, Wallet as WalletIcon } from 'lucide-react';
import type { CurrencyCode } from '../domain/currencies';
import { totalIn } from '../domain/ledger';
import { formatMoney, parseAmount } from '../domain/money';
import type { Wallet, WalletColor } from '../domain/types';
import { newId } from '../domain/types';
import { t, tn } from '../i18n';
import { track } from '../services/analytics';
import { useNav } from '../state/nav';
import { useStore } from '../state/store';
import { Button, Card, EmptyState, Field, IconButton, inputClass, ScreenHeader } from '../ui/kit';
import { ColorPicker, CurrencyField, WALLET_COLORS, WALLET_GRADIENTS } from '../ui/pickers';
import { ConfirmSheet, Sheet } from '../ui/Sheet';

export const Wallets = () => {
  const { data, balances, rates } = useStore();
  const nav = useNav();
  const base = data.user!.baseCurrency;
  const [editing, setEditing] = useState<Wallet | 'new' | null>(null);
  const total = useMemo(() => totalIn(data.wallets, balances, base, rates), [data.wallets, balances, base, rates]);

  return (
    <div className="animate-in fade-in duration-300">
      <ScreenHeader
        title={t('wallets.title')}
        subtitle={t('wallets.total', { amount: formatMoney(total, base) })}
        actions={
          <>
            {data.wallets.length > 1 && (
              <IconButton label={t('common.transfer')} onClick={() => nav.openEditor({ mode: 'transfer' })}>
                <ArrowLeftRight size={20} />
              </IconButton>
            )}
            <IconButton label={t('wallets.add')} onClick={() => setEditing('new')} className="bg-brand text-brand-ink border-0">
              <Plus size={22} />
            </IconButton>
          </>
        }
      />

      {data.wallets.length === 0 ? (
        <EmptyState icon={<WalletIcon size={26} />} title={t('wallets.empty')} action={<Button onClick={() => setEditing('new')}>{t('wallets.add')}</Button>} />
      ) : (
        <div className="space-y-3">
          {data.wallets.map((w) => {
            const count = data.transactions.filter((tx) => tx.walletId === w.id).length;
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => setEditing(w)}
                className="press relative block w-full overflow-hidden rounded-3xl p-5 text-start text-white shadow-lg"
                style={{ background: WALLET_GRADIENTS[w.color] }}
              >
                <div className="flex items-start justify-between">
                  <span className="text-base font-semibold">{w.name}</span>
                  <span className="rounded-lg bg-white/20 px-2 py-0.5 text-xs font-bold">{w.currency}</span>
                </div>
                <p className="tabular mt-6 text-3xl font-bold tracking-tight">{formatMoney(balances.get(w.id) ?? 0, w.currency)}</p>
                <p className="mt-1 text-sm opacity-80">{tn('wallets.txCount', count)}</p>
                <span className="pointer-events-none absolute -end-10 -top-10 size-40 rounded-full bg-white/10" />
              </button>
            );
          })}
        </div>
      )}

      {data.wallets.length === 1 && (
        <Card className="mt-4">
          <p className="text-[15px] font-medium text-ink">{t('wallets.tipTitle')}</p>
          <p className="mt-1 text-sm text-muted">{t('wallets.tipBody')}</p>
        </Card>
      )}

      <WalletSheet wallet={editing} onClose={() => setEditing(null)} />
    </div>
  );
};

const WalletSheet = ({ wallet, onClose }: { wallet: Wallet | 'new' | null; onClose: () => void }) => {
  const { data, balances, dispatch } = useStore();
  const isNew = wallet === 'new';
  const existing = wallet && wallet !== 'new' ? wallet : null;
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>(data.user!.baseCurrency);
  const [color, setColor] = useState<WalletColor>('emerald');
  const [balance, setBalance] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const txCount = existing ? data.transactions.filter((tx) => tx.walletId === existing.id).length : 0;
  const currentBalance = existing ? (balances.get(existing.id) ?? 0) : 0;

  useEffect(() => {
    if (!wallet) return;
    if (existing) {
      setName(existing.name);
      setCurrency(existing.currency);
      setColor(existing.color);
      setBalance(String(currentBalance));
    } else {
      setName('');
      setCurrency(data.user!.baseCurrency);
      setColor(WALLET_COLORS[data.wallets.length % WALLET_COLORS.length]);
      setBalance('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet]);

  const save = () => {
    const parsed = parseAmount(balance || '0');
    const target = Number.isFinite(parsed) ? parsed : currentBalance;
    if (existing) {
      // Editing the current balance adjusts the opening balance; history stays intact.
      dispatch({
        type: 'upsertWallet',
        wallet: { ...existing, name: name.trim() || existing.name, currency, color, openingBalance: existing.openingBalance + (target - currentBalance) },
      });
      track('wallet_updated');
    } else {
      dispatch({
        type: 'upsertWallet',
        wallet: { id: newId(), name: name.trim() || t('wallets.defaultName'), currency, color, openingBalance: target, createdAt: Date.now() },
      });
      track('wallet_created', { currency, count: data.wallets.length + 1 });
    }
    onClose();
  };

  const remove = () => {
    if (!existing) return;
    dispatch({ type: 'deleteWallet', id: existing.id });
    track('wallet_deleted', { had_transactions: txCount > 0 });
    setConfirmDelete(false);
    onClose();
  };

  return (
    <Sheet
      open={!!wallet}
      onClose={onClose}
      title={isNew ? t('wallets.add') : t('wallets.edit')}
      footer={
        <div className="flex gap-3">
          {existing && (
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              {t('common.delete')}
            </Button>
          )}
          <Button block size="lg" onClick={save} disabled={!name.trim()}>
            {isNew ? t('wallets.create') : t('common.saveChanges')}
          </Button>
        </div>
      }
    >
      <div className="space-y-5 pt-2">
        <Field label={t('wallet.name')}>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder={t('wallets.namePlaceholder')} autoFocus={isNew} />
        </Field>
        <Field label={t('wallet.currency')} hint={txCount > 0 ? t('wallets.currencyLocked') : undefined}>
          <CurrencyField value={currency} onChange={setCurrency} disabled={txCount > 0} />
        </Field>
        <Field label={isNew ? t('wallets.startingBalance') : t('wallets.currentBalance')} hint={isNew ? undefined : t('wallets.balanceHint')}>
          <input inputMode="decimal" className={inputClass} value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="0" />
        </Field>
        <Field label={t('wallets.color')}>
          <ColorPicker value={color} onChange={setColor} />
        </Field>
      </div>
      <ConfirmSheet
        open={confirmDelete}
        danger
        title={t('wallets.deleteTitle', { name: existing?.name ?? '' })}
        body={txCount > 0 ? tn('wallets.deleteBodyTx', txCount) : t('wallets.deleteBody')}
        confirmLabel={t('common.delete')}
        onConfirm={remove}
        onClose={() => setConfirmDelete(false)}
      />
    </Sheet>
  );
};
