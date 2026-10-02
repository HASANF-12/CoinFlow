import { useEffect, useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { fromDateInput, toDateInput, type Range } from '../domain/dates';
import { t } from '../i18n';
import { track } from '../services/analytics';
import { exportSpreadsheet } from '../services/backup';
import { useStore } from '../state/store';
import { Button, Field, inputClass } from '../ui/kit';
import { Sheet } from '../ui/Sheet';
import { useToast } from '../ui/Toast';

export const ExportSheet = ({ open, onClose, defaultRange }: { open: boolean; onClose: () => void; defaultRange: Range }) => {
  const { data } = useStore();
  const toast = useToast();
  const [from, setFrom] = useState(toDateInput(defaultRange.start));
  const [to, setTo] = useState(toDateInput(defaultRange.end - 1));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFrom(toDateInput(defaultRange.start));
    setTo(toDateInput(Math.min(defaultRange.end - 1, Date.now())));
  }, [open, defaultRange]);

  const run = async () => {
    setBusy(true);
    try {
      const start = fromDateInput(from, new Date(2000, 0, 1, 0, 0, 0).getTime());
      const end = fromDateInput(to, new Date(2000, 0, 1, 0, 0, 0).getTime()) + 24 * 60 * 60 * 1000;
      await exportSpreadsheet(data, { start, end }, { income: t('common.income'), expense: t('common.expense') });
      track('data_exported', { format: 'xlsx' });
      onClose();
    } catch {
      toast({ message: t('export.failed') });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title={t('export.title')}>
      <p className="text-[15px] text-muted">{t('export.body')}</p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Field label={t('export.from')}>
          <input type="date" className={inputClass} value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field label={t('export.to')}>
          <input type="date" className={inputClass} value={to} min={from} onChange={(e) => setTo(e.target.value)} />
        </Field>
      </div>
      <Button block size="lg" className="mt-6" disabled={busy || !from || !to} onClick={run}>
        <FileSpreadsheet size={20} /> {t('export.excel')}
      </Button>
    </Sheet>
  );
};
