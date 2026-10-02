import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { t } from '../i18n';
import { useBackHandler } from './back';
import { Button, cx } from './kit';

/** Bottom sheet on phones. Closes on backdrop tap and on Android back. */
export const Sheet = ({
  open,
  onClose,
  title,
  children,
  footer,
  full,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Takes the whole screen (editors). */
  full?: boolean;
}) => {
  useBackHandler(open, onClose);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label={t('common.close')} className="absolute inset-0 bg-black/60 animate-in fade-in duration-200" onClick={onClose} />
      <div
        className={cx(
          'relative mx-auto flex w-full max-w-lg flex-col bg-surface border-t border-line animate-in slide-in-from-bottom duration-300',
          full ? 'h-full pt-safe' : 'max-h-[88vh] rounded-t-[28px]',
        )}
      >
        {!full && <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-surface-3" />}
        {title && (
          <div className="flex items-center justify-between gap-3 px-5 pb-2 pt-3">
            <h2 className="text-lg font-semibold text-ink">{title}</h2>
            <button type="button" onClick={onClose} aria-label={t('common.close')} className="press grid size-9 place-items-center rounded-full bg-surface-2 text-muted">
              <X size={18} />
            </button>
          </div>
        )}
        {/* Full-screen sheets manage their own bottom area (sticky action bar). */}
        <div className={cx('flex-1 overflow-y-auto px-5', !full && 'pb-4')}>{children}</div>
        {footer && <div className="border-t border-line px-5 pt-3 pb-safe">{footer}</div>}
        {!footer && !full && <div className="pb-safe" />}
      </div>
    </div>,
    document.body,
  );
};

export const ConfirmSheet = ({
  open,
  title,
  body,
  confirmLabel,
  danger,
  onConfirm,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children?: ReactNode;
}) => (
  <Sheet open={open} onClose={onClose} title={title}>
    {body && <p className="text-[15px] leading-relaxed text-muted">{body}</p>}
    {children}
    <div className="mt-6 flex gap-3">
      <Button variant="secondary" block onClick={onClose}>
        {t('common.cancel')}
      </Button>
      <Button variant={danger ? 'danger' : 'primary'} block onClick={onConfirm}>
        {confirmLabel}
      </Button>
    </div>
  </Sheet>
);
