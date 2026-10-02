import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { initI18n } from './i18n';
import { StoreProvider } from './state/store';
import { ToastProvider } from './ui/Toast';
import './index.css';

const start = async () => {
  if (import.meta.env.DEV) (await import('./dev/demo')).applyDemoParam();
  initI18n();
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <StoreProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </StoreProvider>
    </StrictMode>,
  );
};

void start();
