import { useEffect, useState } from 'react';
import { Delete, Fingerprint } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { t } from '../i18n';
import { isNative } from '../services/platform';
import { cx } from './kit';

export const PIN_LENGTH = 4;

const tap = () => {
  if (isNative) void Haptics.impact({ style: ImpactStyle.Light }).catch(() => undefined);
};

/**
 * Collects a 4-digit PIN and calls onComplete once full. The caller answers
 * true (accepted) or false (wrong/mismatch → shake and clear).
 */
export const PinPad = ({
  onComplete,
  onBiometric,
  error,
}: {
  onComplete: (pin: string) => boolean | Promise<boolean>;
  onBiometric?: () => void;
  error?: string;
}) => {
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (pin.length !== PIN_LENGTH) return;
    let cancelled = false;
    Promise.resolve(onComplete(pin)).then((ok) => {
      if (cancelled || ok) return;
      setShake(true);
      setTimeout(() => {
        setShake(false);
        setPin('');
      }, 450);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const press = (d: string) => {
    tap();
    setPin((p) => (p.length < PIN_LENGTH ? p + d : p));
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'bio', '0', 'del'];
  return (
    <div className="flex flex-col items-center">
      <div className={cx('mb-3 flex gap-4', shake && 'animate-[shake_0.4s]')} aria-label={t('pin.entered', { count: pin.length })}>
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <span key={i} className={cx('size-3.5 rounded-full border-2 transition-colors', i < pin.length ? 'border-brand bg-brand' : 'border-surface-3')} />
        ))}
      </div>
      <p className="mb-6 h-5 text-sm font-medium text-danger">{error}</p>
      <div dir="ltr" className="grid grid-cols-3 gap-4">
        {keys.map((k) =>
          k === 'bio' ? (
            onBiometric ? (
              <button key={k} type="button" aria-label={t('pin.useBiometric')} onClick={onBiometric} className="press grid size-18 place-items-center rounded-full text-brand">
                <Fingerprint size={30} />
              </button>
            ) : (
              <span key={k} />
            )
          ) : k === 'del' ? (
            <button key={k} type="button" aria-label={t('pin.delete')} onClick={() => setPin((p) => p.slice(0, -1))} className="press grid size-18 place-items-center rounded-full text-muted">
              <Delete size={26} />
            </button>
          ) : (
            <button key={k} type="button" onClick={() => press(k)} className="press grid size-18 place-items-center rounded-full bg-surface-2 text-2xl font-semibold text-ink border border-line">
              {k}
            </button>
          ),
        )}
      </div>
    </div>
  );
};
