import { useState } from 'react';
import { ArrowRight, Bell, PieChart, ShieldCheck, Wallet as WalletIcon } from 'lucide-react';
import { guessCurrency, type CurrencyCode } from '../domain/currencies';
import { parseAmount } from '../domain/money';
import { newId } from '../domain/types';
import { t } from '../i18n';
import { track } from '../services/analytics';
import { useStore } from '../state/store';
import { AmountInput } from '../ui/AmountInput';
import { Button, Field, inputClass } from '../ui/kit';
import { CurrencyField } from '../ui/pickers';

export const Onboarding = () => {
  const { dispatch } = useStore();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>(() => guessCurrency());
  const [walletName, setWalletName] = useState(t('onboarding.defaultWallet'));
  const [balance, setBalance] = useState('');

  const finish = () => {
    const now = Date.now();
    const opening = parseAmount(balance);
    dispatch({
      type: 'createUser',
      user: { name: name.trim(), baseCurrency: currency, notificationsEnabled: false, onboardedAt: now, lastOpenDate: now },
    });
    dispatch({
      type: 'upsertWallet',
      wallet: {
        id: newId(),
        name: walletName.trim() || t('onboarding.defaultWallet'),
        currency,
        color: 'emerald',
        openingBalance: Number.isFinite(opening) ? opening : 0,
        createdAt: now,
      },
    });
    track('onboarding_completed', { currency });
  };

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col px-6 pt-safe pb-safe">
      <div className="mt-2 flex gap-1.5" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-brand' : 'bg-surface-3'}`} />
        ))}
      </div>

      {step === 0 && (
        <div className="flex flex-1 flex-col animate-in fade-in duration-500">
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <img src="/logo.png" alt="" className="mb-6 size-24 rounded-3xl shadow-2xl shadow-brand/20" />
            <h1 className="text-3xl font-bold tracking-tight text-ink">{t('onboarding.welcome.title')}</h1>
            <p className="mt-3 max-w-xs text-base text-muted">{t('onboarding.welcome.body')}</p>
            <ul className="mt-10 w-full space-y-3 text-start">
              {[
                { icon: <WalletIcon size={20} />, text: t('onboarding.benefit.wallets') },
                { icon: <PieChart size={20} />, text: t('onboarding.benefit.budgets') },
                { icon: <Bell size={20} />, text: t('onboarding.benefit.reminders') },
                { icon: <ShieldCheck size={20} />, text: t('onboarding.benefit.private') },
              ].map((b) => (
                <li key={b.text} className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 border border-line">
                  <span className="text-brand">{b.icon}</span>
                  <span className="text-[15px] text-ink">{b.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <Button size="lg" block className="mt-8" onClick={() => setStep(1)}>
            {t('onboarding.start')} <ArrowRight size={20} className="rtl:rotate-180" />
          </Button>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-1 flex-col animate-in fade-in slide-in-from-right-4 duration-300">
          <h1 className="mt-10 text-2xl font-bold text-ink">{t('onboarding.about.title')}</h1>
          <p className="mt-1 text-muted">{t('onboarding.about.body')}</p>
          <div className="mt-8 space-y-5">
            <Field label={t('onboarding.name')} hint={t('common.optional')}>
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder={t('onboarding.namePlaceholder')} autoComplete="given-name" />
            </Field>
            <Field label={t('onboarding.currency')} hint={t('onboarding.currencyHint')}>
              <CurrencyField value={currency} onChange={setCurrency} />
            </Field>
          </div>
          <div className="flex-1" />
          <Button size="lg" block onClick={() => setStep(2)}>
            {t('common.continue')}
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-1 flex-col animate-in fade-in slide-in-from-right-4 duration-300">
          <h1 className="mt-10 text-2xl font-bold text-ink">{t('onboarding.wallet.title')}</h1>
          <p className="mt-1 text-muted">{t('onboarding.wallet.body')}</p>
          <div className="mt-8 space-y-5">
            <Field label={t('wallet.name')}>
              <input className={inputClass} value={walletName} onChange={(e) => setWalletName(e.target.value)} />
            </Field>
            <div>
              <span className="mb-1.5 block px-1 text-sm font-medium text-muted">{t('onboarding.wallet.balance')}</span>
              <div className="rounded-3xl border border-line bg-surface-2">
                <AmountInput value={balance} onChange={setBalance} currency={currency} label={t('onboarding.wallet.balance')} />
              </div>
              <span className="mt-1.5 block px-1 text-xs text-faint">{t('onboarding.wallet.balanceHint')}</span>
            </div>
          </div>
          <div className="flex-1" />
          <div className="flex gap-3">
            <Button variant="secondary" size="lg" onClick={() => setStep(1)}>
              {t('common.back')}
            </Button>
            <Button size="lg" block onClick={finish}>
              {t('onboarding.finish')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
