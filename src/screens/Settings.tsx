import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  Clock,
  Coins,
  DatabaseBackup,
  ExternalLink,
  FileDown,
  FileUp,
  Fingerprint,
  KeyRound,
  Mail,
  ShieldCheck,
  Star,
  Trash2,
  Upload,
  User,
} from 'lucide-react';
import type { CurrencyCode } from '../domain/currencies';
import { monthRange } from '../domain/dates';
import { t, tn } from '../i18n';
import { needsPrivacyOptions, showPrivacyOptions } from '../services/ads';
import { track } from '../services/analytics';
import { exportBackup, pickFile, readImport, type ImportResult } from '../services/backup';
import { rescheduleReminders, requestNotifications } from '../services/notifications';
import { APP_VERSION, PLAY_URL, PRIVACY_URL, SUPPORT_EMAIL } from '../services/platform';
import { checkDeviceAuth, hashPin, newSalt, verifyPin } from '../services/security';
import { wipeAllLocalData } from '../services/storage';
import { useNav } from '../state/nav';
import { useStore } from '../state/store';
import { Button, Field, IconButton, inputClass, ListGroup, ListRow, SectionTitle, Toggle } from '../ui/kit';
import { CurrencyPicker, currencyName } from '../ui/pickers';
import { PinPad } from '../ui/PinPad';
import { ConfirmSheet, Sheet } from '../ui/Sheet';
import { useToast } from '../ui/Toast';
import { ExportSheet } from './ExportSheet';

const REMINDER_HOURS = [8, 12, 18, 20, 21, 22];
const hourLabel = (h: number) => new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(2000, 0, 1, h));

export const Settings = () => {
  const { data, dispatch, rates, setPin } = useStore();
  const nav = useNav();
  const toast = useToast();
  const user = data.user!;

  const [nameOpen, setNameOpen] = useState(false);
  const [name, setName] = useState(user.name);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [pinFlow, setPinFlow] = useState<'set' | 'change' | 'remove' | null>(null);
  const [biometryAvailable, setBiometryAvailable] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState<ImportResult | null>(null);
  const [eraseOpen, setEraseOpen] = useState(false);

  useEffect(() => {
    void checkDeviceAuth().then((d) => setBiometryAvailable(d.biometry));
  }, []);

  const updateReminders = (patch: { notificationsEnabled?: boolean; reminderHour?: number }) => {
    const next = { ...user, ...patch };
    dispatch({ type: 'setUser', patch });
    void rescheduleReminders({ enabled: next.notificationsEnabled, reminderHour: next.reminderHour, name: next.name });
  };

  const toggleNotifications = async (on: boolean) => {
    if (on && !(await requestNotifications())) {
      toast({ message: t('settings.notifDenied') });
      return;
    }
    updateReminders({ notificationsEnabled: on, reminderHour: on ? (user.reminderHour ?? 20) : user.reminderHour });
  };

  const startImport = async (accept: string) => {
    const file = await pickFile(accept);
    if (!file) return;
    const result = await readImport(file, data, rates);
    if (result.kind === 'error') toast({ message: result.reason === 'empty' ? t('import.empty') : t('import.unreadable') });
    else setPendingImport(result);
  };

  const applyImport = async () => {
    const r = pendingImport;
    setPendingImport(null);
    if (!r || r.kind === 'error') return;
    if (r.kind === 'replace') {
      let next = r.data;
      // Keep this device's user profile (PIN, reminders) when restoring into an onboarded app.
      if (next.user && user) next = { ...next, user: { ...next.user, pinHash: user.pinHash, pinSalt: user.pinSalt, biometricUnlock: user.biometricUnlock } };
      if (r.legacyPin && next.user && !next.user.pinHash) {
        const salt = newSalt();
        next = { ...next, user: { ...next.user, pinSalt: salt, pinHash: await hashPin(r.legacyPin, salt) } };
      }
      if (!next.user) next = { ...next, user };
      dispatch({ type: 'replace', data: next });
      toast({ message: t('import.restored') });
    } else {
      dispatch({ type: 'merge', wallets: r.wallets, transactions: r.transactions });
      toast({ message: tn('import.merged', r.transactions.length) });
    }
    track('data_imported', { kind: r.kind });
  };

  const erase = async () => {
    await wipeAllLocalData();
    track('data_cleared');
    dispatch({ type: 'reset' });
  };

  return (
    <div className="animate-in fade-in duration-300">
      <header className="mb-5 flex items-center gap-3">
        <IconButton label={t('common.back')} onClick={() => nav.go('home')}>
          <ArrowLeft size={20} className="rtl:rotate-180" />
        </IconButton>
        <h1 className="text-2xl font-bold tracking-tight text-ink">{t('settings.title')}</h1>
      </header>

      <SectionTitle>{t('settings.profile')}</SectionTitle>
      <ListGroup>
        <ListRow icon={<User size={18} />} title={t('settings.name')} subtitle={user.name || t('settings.noName')} onClick={() => { setName(user.name); setNameOpen(true); }} />
        <ListRow icon={<Coins size={18} />} title={t('settings.mainCurrency')} subtitle={currencyName(user.baseCurrency)} onClick={() => setCurrencyOpen(true)} />
      </ListGroup>

      <SectionTitle>{t('settings.security')}</SectionTitle>
      <ListGroup>
        <ListRow
          icon={<KeyRound size={18} />}
          title={user.pinHash ? t('settings.changePin') : t('settings.setPin')}
          subtitle={user.pinHash ? t('settings.pinOn') : t('settings.pinOff')}
          onClick={() => setPinFlow(user.pinHash ? 'change' : 'set')}
        />
        {user.pinHash && biometryAvailable && (
          <ListRow
            icon={<Fingerprint size={18} />}
            title={t('settings.biometric')}
            subtitle={t('settings.biometricHint')}
            trailing={<Toggle checked={!!user.biometricUnlock} label={t('settings.biometric')} onChange={(v) => dispatch({ type: 'setUser', patch: { biometricUnlock: v } })} />}
          />
        )}
        {user.pinHash && <ListRow icon={<ShieldCheck size={18} />} title={t('settings.removePin')} onClick={() => setPinFlow('remove')} />}
      </ListGroup>

      <SectionTitle>{t('settings.notifications')}</SectionTitle>
      <ListGroup>
        <ListRow
          icon={<Bell size={18} />}
          title={t('settings.notifEnable')}
          subtitle={t('settings.notifHint')}
          trailing={<Toggle checked={user.notificationsEnabled} label={t('settings.notifEnable')} onChange={toggleNotifications} />}
        />
        {user.notificationsEnabled && (
          <ListRow
            icon={<Clock size={18} />}
            title={t('settings.dailyReminder')}
            subtitle={user.reminderHour === undefined ? t('common.off') : hourLabel(user.reminderHour)}
            onClick={() => setReminderOpen(true)}
          />
        )}
      </ListGroup>

      <SectionTitle>{t('settings.data')}</SectionTitle>
      <ListGroup>
        <ListRow
          icon={<DatabaseBackup size={18} />}
          title={t('settings.backup')}
          subtitle={t('settings.backupHint')}
          onClick={async () => {
            try {
              await exportBackup(data);
              track('data_exported', { format: 'json' });
            } catch {
              toast({ message: t('export.failed') });
            }
          }}
        />
        <ListRow icon={<Upload size={18} />} title={t('settings.restore')} subtitle={t('settings.restoreHint')} onClick={() => startImport('application/json,.json')} />
        <ListRow icon={<FileDown size={18} />} title={t('settings.exportExcel')} onClick={() => setExportOpen(true)} />
        <ListRow icon={<FileUp size={18} />} title={t('settings.importExcel')} subtitle={t('settings.importExcelHint')} onClick={() => startImport('.xlsx,.xls,.csv')} />
      </ListGroup>

      {needsPrivacyOptions() && (
        <>
          <SectionTitle>{t('settings.privacy')}</SectionTitle>
          <ListGroup>
            <ListRow icon={<ShieldCheck size={18} />} title={t('settings.adChoices')} onClick={() => void showPrivacyOptions()} />
          </ListGroup>
        </>
      )}

      <SectionTitle>{t('settings.about')}</SectionTitle>
      <ListGroup>
        <ListRow icon={<Star size={18} />} title={t('settings.rate')} subtitle={t('settings.rateHint')} onClick={() => window.open(PLAY_URL, '_blank')} />
        <ListRow icon={<Mail size={18} />} title={t('settings.contact')} subtitle={SUPPORT_EMAIL} onClick={() => window.open(`mailto:${SUPPORT_EMAIL}?subject=CoinFlow%20${APP_VERSION}`, '_blank')} />
        <ListRow icon={<ExternalLink size={18} />} title={t('settings.privacyPolicy')} onClick={() => window.open(PRIVACY_URL, '_blank')} />
      </ListGroup>

      <div className="mt-6">
        <ListGroup>
          <ListRow icon={<Trash2 size={18} />} title={t('settings.erase')} danger onClick={() => setEraseOpen(true)} />
        </ListGroup>
      </div>

      <p className="mt-6 text-center text-xs text-faint">
        CoinFlow {APP_VERSION} ·{' '}
        <a href="https://www.exchangerate-api.com" target="_blank" rel="noreferrer" className="underline">
          {t('settings.ratesBy')}
        </a>
      </p>

      {/* Sheets */}
      <Sheet
        open={nameOpen}
        onClose={() => setNameOpen(false)}
        title={t('settings.name')}
        footer={
          <Button
            block
            size="lg"
            onClick={() => {
              dispatch({ type: 'setUser', patch: { name: name.trim() } });
              setNameOpen(false);
            }}
          >
            {t('common.save')}
          </Button>
        }
      >
        <Field label={t('settings.name')}>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </Field>
      </Sheet>

      <CurrencyPicker
        open={currencyOpen}
        value={user.baseCurrency}
        onClose={() => setCurrencyOpen(false)}
        onPick={(c: CurrencyCode) => {
          dispatch({ type: 'setUser', patch: { baseCurrency: c } });
          setCurrencyOpen(false);
        }}
      />

      <Sheet open={reminderOpen} onClose={() => setReminderOpen(false)} title={t('settings.dailyReminder')}>
        <p className="mb-4 text-sm text-muted">{t('settings.reminderBody')}</p>
        <ListGroup>
          {REMINDER_HOURS.map((h) => (
            <ListRow
              key={h}
              title={hourLabel(h)}
              trailing={user.reminderHour === h ? <span className="text-brand">✓</span> : undefined}
              onClick={() => {
                updateReminders({ reminderHour: h });
                setReminderOpen(false);
              }}
            />
          ))}
          <ListRow
            title={t('common.off')}
            trailing={user.reminderHour === undefined ? <span className="text-brand">✓</span> : undefined}
            onClick={() => {
              updateReminders({ reminderHour: undefined });
              setReminderOpen(false);
            }}
          />
        </ListGroup>
      </Sheet>

      <PinFlowSheet flow={pinFlow} onClose={() => setPinFlow(null)} onDone={(msg) => toast({ message: msg })} setPin={setPin} />
      <ExportSheet open={exportOpen} onClose={() => setExportOpen(false)} defaultRange={monthRange(Date.now())} />

      <ConfirmSheet
        open={!!pendingImport}
        title={pendingImport?.kind === 'replace' ? t('import.replaceTitle') : t('import.mergeTitle')}
        body={
          pendingImport?.kind === 'replace'
            ? t('import.replaceBody', { wallets: pendingImport.data.wallets.length, transactions: pendingImport.data.transactions.length })
            : pendingImport?.kind === 'merge'
              ? t('import.mergeBody', { transactions: pendingImport.transactions.length, wallets: pendingImport.wallets.length })
              : ''
        }
        confirmLabel={pendingImport?.kind === 'replace' ? t('import.replaceConfirm') : t('import.mergeConfirm')}
        danger={pendingImport?.kind === 'replace'}
        onConfirm={applyImport}
        onClose={() => setPendingImport(null)}
      />
      <ConfirmSheet open={eraseOpen} danger title={t('settings.eraseTitle')} body={t('settings.eraseBody')} confirmLabel={t('settings.erase')} onConfirm={erase} onClose={() => setEraseOpen(false)} />
    </div>
  );
};

const PinFlowSheet = ({
  flow,
  onClose,
  onDone,
  setPin,
}: {
  flow: 'set' | 'change' | 'remove' | null;
  onClose: () => void;
  onDone: (message: string) => void;
  setPin: (pin: string | null) => Promise<void>;
}) => {
  const { data } = useStore();
  const user = data.user!;
  const [stage, setStage] = useState<'verify' | 'new' | 'confirm'>('new');
  const [first, setFirst] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!flow) return;
    setStage(flow === 'set' ? 'new' : 'verify');
    setFirst('');
    setError('');
  }, [flow]);

  const onComplete = async (pin: string) => {
    if (stage === 'verify') {
      if (!(await verifyPin(pin, user.pinHash!, user.pinSalt!))) {
        setError(t('lock.wrong'));
        return false;
      }
      setError('');
      if (flow === 'remove') {
        await setPin(null);
        onDone(t('settings.pinRemoved'));
        onClose();
      } else setStage('new');
      return true;
    }
    if (stage === 'new') {
      setFirst(pin);
      setError('');
      setStage('confirm');
      return true;
    }
    if (pin !== first) {
      setError(t('pin.mismatch'));
      setStage('new');
      return false;
    }
    await setPin(pin);
    onDone(flow === 'change' ? t('settings.pinChanged') : t('settings.pinSaved'));
    onClose();
    return true;
  };

  const title = stage === 'verify' ? t('pin.current') : stage === 'new' ? t('pin.new') : t('pin.confirm');
  return (
    <Sheet open={!!flow} onClose={onClose} title={title}>
      <div className="py-4">
        {/* Remount per stage so the dots reset. */}
        <PinPad key={stage} onComplete={onComplete} error={error} />
      </div>
    </Sheet>
  );
};
