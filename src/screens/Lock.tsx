import { useCallback, useEffect, useRef, useState } from 'react';
import { Lock as LockIcon } from 'lucide-react';
import { t } from '../i18n';
import { authenticateWithDevice, checkDeviceAuth, verifyPin, type DeviceAuth } from '../services/security';
import { wipeAllLocalData } from '../services/storage';
import { useStore } from '../state/store';
import { Button } from '../ui/kit';
import { PinPad } from '../ui/PinPad';
import { ConfirmSheet, Sheet } from '../ui/Sheet';

const MAX_ATTEMPTS_BEFORE_DELAY = 5;

export const Lock = ({ onUnlock }: { onUnlock: (pinRemoved?: boolean) => void }) => {
  const { data, setPin, dispatch } = useStore();
  const user = data.user!;
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [device, setDevice] = useState<DeviceAuth>({ biometry: false, deviceSecure: false });
  const [forgotOpen, setForgotOpen] = useState(false);
  const [eraseOpen, setEraseOpen] = useState(false);

  // The parent re-renders (and passes a new onUnlock) while this screen is up; keep the latest in a ref
  // so the automatic prompt below runs exactly once instead of once per render.
  const onUnlockRef = useRef(onUnlock);
  onUnlockRef.current = onUnlock;
  const prompting = useRef(false);

  const tryBiometric = useCallback(async () => {
    if (prompting.current) return;
    prompting.current = true;
    try {
      if (await authenticateWithDevice(t('lock.biometricReason'), false)) onUnlockRef.current();
    } finally {
      prompting.current = false;
    }
  }, []);

  useEffect(() => {
    void checkDeviceAuth().then((d) => {
      setDevice(d);
      if (user.biometricUnlock && d.biometry) void tryBiometric();
    });
    // Only when the lock screen first appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!lockedUntil) return;
    const id = setInterval(() => {
      if (Date.now() >= lockedUntil) {
        setLockedUntil(0);
        setError('');
      }
    }, 500);
    return () => clearInterval(id);
  }, [lockedUntil]);

  const check = async (pin: string) => {
    if (Date.now() < lockedUntil) return false;
    if (await verifyPin(pin, user.pinHash!, user.pinSalt!)) {
      onUnlock();
      return true;
    }
    const n = attempts + 1;
    setAttempts(n);
    if (n >= MAX_ATTEMPTS_BEFORE_DELAY) {
      setLockedUntil(Date.now() + 30_000);
      setError(t('lock.tooMany'));
    } else setError(t('lock.wrong'));
    return false;
  };

  const recoverWithDevice = async () => {
    if (await authenticateWithDevice(t('lock.recoverReason'), true)) {
      await setPin(null);
      setForgotOpen(false);
      onUnlock(true);
    }
  };

  const erase = async () => {
    await wipeAllLocalData();
    dispatch({ type: 'reset' });
    onUnlock();
  };

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col items-center px-6 pt-safe pb-safe">
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="mb-5 grid size-16 place-items-center rounded-2xl bg-brand-soft text-brand">
          <LockIcon size={28} />
        </div>
        <h1 className="text-xl font-semibold text-ink">{user.name ? t('lock.titleNamed', { name: user.name }) : t('lock.title')}</h1>
        <p className="mb-8 mt-1 text-sm text-muted">{t('lock.subtitle')}</p>
        <PinPad onComplete={check} error={error} onBiometric={user.biometricUnlock && device.biometry ? tryBiometric : undefined} />
      </div>
      <Button variant="ghost" onClick={() => setForgotOpen(true)}>
        {t('lock.forgot')}
      </Button>

      <Sheet open={forgotOpen} onClose={() => setForgotOpen(false)} title={t('lock.forgot')}>
        {device.deviceSecure ? (
          <>
            <p className="text-[15px] leading-relaxed text-muted">{t('lock.forgotDevice')}</p>
            <Button block size="lg" className="mt-6" onClick={recoverWithDevice}>
              {t('lock.verifyDevice')}
            </Button>
          </>
        ) : (
          <>
            <p className="text-[15px] leading-relaxed text-muted">{t('lock.forgotNoDevice')}</p>
            <Button variant="danger" block size="lg" className="mt-6" onClick={() => setEraseOpen(true)}>
              {t('lock.eraseAndRestart')}
            </Button>
          </>
        )}
      </Sheet>
      <ConfirmSheet
        open={eraseOpen}
        danger
        title={t('lock.eraseConfirmTitle')}
        body={t('lock.eraseConfirmBody')}
        confirmLabel={t('lock.eraseAndRestart')}
        onConfirm={erase}
        onClose={() => setEraseOpen(false)}
      />
    </div>
  );
};
