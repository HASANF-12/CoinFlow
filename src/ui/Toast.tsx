import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ToastOptions {
  message: string;
  action?: { label: string; run: () => void };
  /** Runs when the toast disappears without its action being used (e.g. finalise a delete). */
  onExpire?: () => void;
  duration?: number;
}

const ToastContext = createContext<(o: ToastOptions) => void>(() => {});
export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toast, setToast] = useState<(ToastOptions & { id: number }) | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const current = useRef<ToastOptions | null>(null);

  const dismiss = useCallback((expired: boolean) => {
    clearTimeout(timer.current);
    if (expired) current.current?.onExpire?.();
    current.current = null;
    setToast(null);
  }, []);

  const show = useCallback(
    (o: ToastOptions) => {
      // A new toast replaces the old one; the old one counts as expired.
      if (current.current) current.current.onExpire?.();
      clearTimeout(timer.current);
      current.current = o;
      setToast({ ...o, id: Date.now() });
      timer.current = setTimeout(() => dismiss(true), o.duration ?? (o.action ? 5000 : 2800));
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast &&
        createPortal(
          <div
            key={toast.id}
            role="status"
            className="fixed inset-x-4 z-[60] mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-bg shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-200"
            style={{ bottom: 'calc(var(--nav-h) + var(--sab) + var(--ad-h, 0px) + 12px)' }}
          >
            <span className="flex-1 text-[15px] font-medium">{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                className="press rounded-lg px-2 py-1 text-[15px] font-bold text-brand-ink bg-brand"
                onClick={() => {
                  toast.action!.run();
                  dismiss(false);
                }}
              >
                {toast.action.label}
              </button>
            )}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
};
