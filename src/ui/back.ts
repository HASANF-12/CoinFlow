import { useEffect, useRef, useSyncExternalStore } from 'react';

// Android's back button closes the top-most sheet first, then falls back to the app shell.
type Handler = () => void;
const stack: { id: number; handler: { current: Handler } }[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** True while any sheet/dialog is open (used to hide the native ad banner, which would cover it). */
export const useOverlayOpen = () =>
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => stack.length > 0,
  );

/** Returns true when an open sheet consumed the back press. */
export const handleBack = (): boolean => {
  const top = stack[stack.length - 1];
  if (!top) return false;
  top.handler.current();
  return true;
};

export const useBackHandler = (active: boolean, handler: Handler) => {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!active) return;
    const entry = { id: nextId++, handler: ref };
    stack.push(entry);
    emit();
    return () => {
      const i = stack.findIndex((e) => e.id === entry.id);
      if (i !== -1) stack.splice(i, 1);
      emit();
    };
  }, [active]);
};
