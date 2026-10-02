import { useState } from 'react';
import { Bell, CalendarDays, CircleCheck, DatabaseBackup, KeyRound, Pencil, Undo2 } from 'lucide-react';
import { t } from '../i18n';
import { track } from '../services/analytics';
import { rescheduleReminders, requestNotifications } from '../services/notifications';
import { useStore } from '../state/store';
import { Button } from '../ui/kit';
import { PinPad } from '../ui/PinPad';
import { Sheet } from '../ui/Sheet';

/** Shown once, right after the first transaction: the moment users see value and say yes. */
export const FirstEntryPrompt = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { data, dispatch, setPin } = useStore();
  const user = data.user!;
  const [stage, setStage] = useState<'offer' | 'pin' | 'confirm'>('offer');
  const [first, setFirst] = useState('');
  const [remindersOn, setRemindersOn] = useState(user.notificationsEnabled);

  const close = () => {
    dispatch({ type: 'setUser', patch: { pinPromptSeen: true } });
    if (!user.pinHash) track('pin_skipped');
    setStage('offer');
    onClose();
  };

  const enableReminders = async () => {
    if (!(await requestNotifications())) return;
    dispatch({ type: 'setUser', patch: { notificationsEnabled: true, reminderHour: 20 } });
    await rescheduleReminders({ enabled: true, reminderHour: 20, name: user.name });
    setRemindersOn(true);
  };

  return (
    <Sheet open={open} onClose={close} title={stage === 'offer' ? t('prompt.first.title') : stage === 'pin' ? t('pin.new') : t('pin.confirm')}>
      {stage === 'offer' ? (
        <>
          <p className="text-[15px] text-muted">{t('prompt.first.body')}</p>
          <div className="mt-5 space-y-3">
            <Button variant="secondary" block size="lg" onClick={enableReminders} disabled={remindersOn} className="justify-start">
              {remindersOn ? <CircleCheck size={20} className="text-brand" /> : <Bell size={20} className="text-brand" />}
              {remindersOn ? t('prompt.first.remindersOn') : t('prompt.first.reminders')}
            </Button>
            <Button variant="secondary" block size="lg" onClick={() => setStage('pin')} disabled={!!user.pinHash} className="justify-start">
              <KeyRound size={20} className="text-brand" /> {t('prompt.first.pin')}
            </Button>
          </div>
          <Button variant="ghost" block className="mt-4" onClick={close}>
            {remindersOn ? t('common.done') : t('common.notNow')}
          </Button>
        </>
      ) : (
        <div className="py-4">
          <PinPad
            key={stage}
            onComplete={async (pin) => {
              if (stage === 'pin') {
                setFirst(pin);
                setStage('confirm');
                return true;
              }
              if (pin !== first) {
                setStage('pin');
                return false;
              }
              await setPin(pin);
              setStage('offer');
              return true;
            }}
          />
        </div>
      )}
    </Sheet>
  );
};

export const WhatsNew = ({ open, onClose }: { open: boolean; onClose: () => void }) => (
  <Sheet open={open} onClose={onClose} title={t('whatsNew.title')}>
    <p className="text-[15px] text-muted">{t('whatsNew.body')}</p>
    <ul className="mt-5 space-y-4">
      {[
        { icon: <Pencil size={18} />, text: t('whatsNew.edit') },
        { icon: <CalendarDays size={18} />, text: t('whatsNew.dates') },
        { icon: <Undo2 size={18} />, text: t('whatsNew.undo') },
        { icon: <DatabaseBackup size={18} />, text: t('whatsNew.backup') },
        { icon: <Bell size={18} />, text: t('whatsNew.reminders') },
      ].map((item) => (
        <li key={item.text} className="flex gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">{item.icon}</span>
          <span className="pt-1.5 text-[15px] text-ink">{item.text}</span>
        </li>
      ))}
    </ul>
    <Button block size="lg" className="mt-6" onClick={onClose}>
      {t('whatsNew.cta')}
    </Button>
  </Sheet>
);
