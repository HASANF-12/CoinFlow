import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, Camera, Image as ImageIcon, Plus, Trash2, X } from 'lucide-react';
import { pickableCategories } from '../domain/categories';
import { fromDateInput, toDateInput } from '../domain/dates';
import { convert, formatMoney, parseAmount, roundMoney } from '../domain/money';
import type { Frequency, Transaction, TxType } from '../domain/types';
import { formatDate, frequencyLabel, t } from '../i18n';
import { captureReceipt, deleteReceipt, receiptSrc } from '../services/receipts';
import type { EditorRequest } from '../state/nav';
import { useStore } from '../state/store';
import { AmountInput } from '../ui/AmountInput';
import { Button, Chip, cx, EmptyState, Field, inputClass, Segmented } from '../ui/kit';
import { CategoryGrid, WalletChips } from '../ui/pickers';
import { Sheet } from '../ui/Sheet';
import { useToast } from '../ui/Toast';

type Mode = TxType | 'transfer';
const FREQUENCIES: Frequency[] = ['daily', 'weekly', 'monthly', 'yearly'];

const amountText = (n: number) => (n ? String(n) : '');

export const TransactionEditor = ({
  request,
  onClose,
  onSaved,
}: {
  request: EditorRequest | null;
  onClose: () => void;
  onSaved: (tx: Transaction | null) => void;
}) => {
  const open = request !== null;
  return (
    <Sheet open={open} onClose={onClose} full>
      {request && <EditorBody request={request} onClose={onClose} onSaved={onSaved} />}
    </Sheet>
  );
};

const EditorBody = ({ request, onClose, onSaved }: { request: EditorRequest; onClose: () => void; onSaved: (tx: Transaction | null) => void }) => {
  const { data, balances, rates, ratesUpdatedAt, addTransaction, updateTransaction, transfer } = useStore();
  const toast = useToast();
  const editing = request.tx;
  const source = request.tx ?? request.copyOf;
  const firstWallet = request.walletId ?? source?.walletId ?? data.wallets[0]?.id ?? '';

  const [mode, setMode] = useState<Mode>(request.mode ?? source?.type ?? 'expense');
  const [amount, setAmount] = useState(amountText(source?.amount ?? 0));
  const [walletId, setWalletId] = useState(firstWallet);
  const [toWalletId, setToWalletId] = useState(data.wallets.find((w) => w.id !== firstWallet)?.id ?? '');
  const [received, setReceived] = useState('');
  const [receivedTouched, setReceivedTouched] = useState(false);
  const [categoryId, setCategoryId] = useState(source?.categoryId ?? pickableCategories('expense')[0].id);
  const [date, setDate] = useState(toDateInput(editing ? editing.date : Date.now()));
  const [note, setNote] = useState(source?.note ?? '');
  const [tags, setTags] = useState<string[]>(source?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [repeat, setRepeat] = useState<Frequency | ''>('');
  const [receipt, setReceipt] = useState<string | undefined>(editing?.receipt);
  const [receiptPreview, setReceiptPreview] = useState<string>('');

  const wallet = data.wallets.find((w) => w.id === walletId);
  const toWallet = data.wallets.find((w) => w.id === toWalletId);
  const value = parseAmount(amount);
  const valid = Number.isFinite(value) && value > 0;
  const crossCurrency = mode === 'transfer' && wallet && toWallet && wallet.currency !== toWallet.currency;
  const rate = wallet && toWallet ? convert(1, wallet.currency, toWallet.currency, rates) : 1;

  // Keep the category valid for the selected type.
  useEffect(() => {
    if (mode === 'transfer') return;
    if (!pickableCategories(mode).some((c) => c.id === categoryId)) setCategoryId(pickableCategories(mode)[0].id);
  }, [mode, categoryId]);

  // Suggest the converted amount until the user types their own (their bank's real rate).
  useEffect(() => {
    if (!crossCurrency || receivedTouched || !toWallet) return;
    setReceived(valid ? String(roundMoney(value * rate, toWallet.currency)) : '');
  }, [crossCurrency, receivedTouched, value, valid, rate, toWallet]);

  useEffect(() => {
    let alive = true;
    if (receipt) void receiptSrc(receipt).then((src) => alive && setReceiptPreview(src));
    else setReceiptPreview('');
    return () => {
      alive = false;
    };
  }, [receipt]);

  const whenMs = useMemo(() => {
    const keepTime = editing && toDateInput(editing.date) === date ? editing.date : Date.now();
    return fromDateInput(date, keepTime);
  }, [date, editing]);

  if (data.wallets.length === 0) {
    return <EmptyState icon={<Plus size={26} />} title={t('editor.noWallets')} action={<Button onClick={onClose}>{t('common.back')}</Button>} />;
  }

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) setTags([...tags, tag]);
    setTagInput('');
  };

  const pickReceipt = async (from: 'camera' | 'gallery') => {
    const ref = await captureReceipt(from);
    if (!ref) return;
    // Replacing an unsaved receipt: drop the old file straight away.
    if (receipt && receipt !== editing?.receipt) void deleteReceipt(receipt);
    setReceipt(ref);
  };

  const save = () => {
    if (!valid || !wallet) return;
    if (mode === 'transfer') {
      if (!toWallet || toWallet.id === wallet.id) return;
      const got = crossCurrency ? parseAmount(received) : value;
      if (!Number.isFinite(got) || got <= 0) return;
      transfer({ fromId: wallet.id, toId: toWallet.id, amount: value, received: got, date: whenMs, note: note.trim() });
      toast({ message: t('editor.transferSaved') });
      onSaved(null);
      return;
    }
    const base = { walletId: wallet.id, type: mode, amount: value, categoryId, date: whenMs, note: note.trim(), tags, receipt };
    if (editing) {
      const tx = { ...editing, ...base };
      updateTransaction(tx);
      onSaved(tx);
    } else {
      onSaved(addTransaction(base, repeat || undefined));
    }
  };

  const close = () => {
    // Discarding a new entry: remove the photo that was taken for it.
    if (receipt && receipt !== editing?.receipt) void deleteReceipt(receipt);
    onClose();
  };

  const title = editing ? t('editor.editTitle') : t('editor.newTitle');
  const canTransfer = data.wallets.length > 1;

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex items-center justify-between py-2">
        <button type="button" onClick={close} aria-label={t('common.close')} className="press grid size-10 place-items-center rounded-full bg-surface-2 text-muted">
          <X size={20} />
        </button>
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        <span className="size-10" />
      </div>

      {!editing && (
        <Segmented
          className="mt-2"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'expense', label: t('common.expense'), tone: 'expense' },
            { value: 'income', label: t('common.income'), tone: 'income' },
            ...(canTransfer ? [{ value: 'transfer' as Mode, label: t('common.transfer') }] : []),
          ]}
        />
      )}

      <AmountInput value={amount} onChange={setAmount} currency={wallet?.currency ?? 'USD'} tone={mode === 'income' ? 'income' : undefined} autoFocus={!editing} label={t('editor.amount')} />

      <div className="space-y-5 pb-4">
        {mode === 'transfer' ? (
          <>
            <Field label={t('editor.from')}>
              <WalletChips wallets={data.wallets} balances={balances} value={walletId} onChange={setWalletId} />
            </Field>
            <div className="flex justify-center text-faint">
              <ArrowDown size={20} />
            </div>
            <Field label={t('editor.to')}>
              <WalletChips wallets={data.wallets} balances={balances} value={toWalletId} onChange={setToWalletId} exclude={walletId} />
            </Field>
            {crossCurrency && toWallet && (
              <Field
                label={t('editor.received', { currency: toWallet.currency })}
                hint={t('editor.rateHint', {
                  rate: `1 ${wallet!.currency} = ${rate.toPrecision(5)} ${toWallet.currency}`,
                  when: ratesUpdatedAt ? formatDate(ratesUpdatedAt, 'short') : t('editor.offlineRates'),
                })}
              >
                <input
                  inputMode="decimal"
                  className={inputClass}
                  value={received}
                  onChange={(e) => {
                    setReceivedTouched(true);
                    setReceived(e.target.value);
                  }}
                />
              </Field>
            )}
          </>
        ) : (
          <>
            <Field label={t('editor.category')}>
              <CategoryGrid type={mode} value={categoryId} onChange={setCategoryId} />
            </Field>
            {data.wallets.length > 1 && (
              <Field label={t('editor.wallet')}>
                <WalletChips wallets={data.wallets} balances={balances} value={walletId} onChange={setWalletId} />
              </Field>
            )}
          </>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label={t('editor.date')}>
            <input type="date" className={inputClass} value={date} max={toDateInput(Date.now())} onChange={(e) => e.target.value && setDate(e.target.value)} />
          </Field>
          {mode !== 'transfer' && !editing ? (
            <Field label={t('editor.repeat')}>
              <select className={inputClass} value={repeat} onChange={(e) => setRepeat(e.target.value as Frequency | '')}>
                <option value="">{t('editor.repeatNever')}</option>
                {FREQUENCIES.map((f) => (
                  <option key={f} value={f}>
                    {frequencyLabel(f)}
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <span />
          )}
        </div>

        <Field label={t('editor.note')}>
          <input className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('editor.notePlaceholder')} maxLength={140} />
        </Field>

        {mode !== 'transfer' && (
          <>
            <Field label={t('editor.tags')}>
              <div className="flex gap-2">
                <input
                  className={inputClass}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder={t('editor.tagsPlaceholder')}
                />
                <Button variant="secondary" className="h-auto" onClick={addTag} disabled={!tagInput.trim()}>
                  <Plus size={18} />
                </Button>
              </div>
            </Field>
            {tags.length > 0 && (
              <div className="-mt-2 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Chip key={tag} active onClick={() => setTags(tags.filter((x) => x !== tag))}>
                    #{tag} <X size={12} className="ms-1 inline" />
                  </Chip>
                ))}
              </div>
            )}

            <div>
              <span className="mb-1.5 block px-1 text-sm font-medium text-muted">{t('editor.receipt')}</span>
              {receiptPreview ? (
                <div className="relative overflow-hidden rounded-2xl border border-line">
                  <img src={receiptPreview} alt={t('editor.receipt')} className="max-h-56 w-full object-cover" />
                  <button
                    type="button"
                    aria-label={t('editor.removeReceipt')}
                    onClick={() => {
                      if (receipt !== editing?.receipt) void deleteReceipt(receipt);
                      setReceipt(undefined);
                    }}
                    className="press absolute end-2 top-2 grid size-9 place-items-center rounded-full bg-black/60 text-white"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="secondary" onClick={() => pickReceipt('camera')}>
                    <Camera size={18} /> {t('editor.takePhoto')}
                  </Button>
                  <Button variant="secondary" onClick={() => pickReceipt('gallery')}>
                    <ImageIcon size={18} /> {t('editor.fromGallery')}
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="sticky bottom-0 -mx-5 mt-auto border-t border-line bg-surface px-5 pt-3 pb-safe">
        {mode === 'transfer' && wallet && valid && (balances.get(wallet.id) ?? 0) < value && (
          <p className="mb-2 text-center text-sm text-warn">{t('editor.overdraw', { balance: formatMoney(balances.get(wallet.id) ?? 0, wallet.currency) })}</p>
        )}
        <Button size="lg" block disabled={!valid || (mode === 'transfer' && (!toWallet || toWallet.id === walletId))} onClick={save} className={cx(mode === 'income' && 'bg-income')}>
          {editing ? t('common.saveChanges') : mode === 'transfer' ? t('editor.saveTransfer') : t('common.save')}
        </Button>
      </div>
    </div>
  );
};
