import { Capacitor } from '@capacitor/core';

export const isNative = Capacitor.isNativePlatform();
export const isAndroid = Capacitor.getPlatform() === 'android';

export const APP_VERSION = '2.0.1';
export const SUPPORT_EMAIL = 'apputilitydroid@gmail.com';
export const PRIVACY_URL = 'https://hasanf-12.github.io/CoinFlowApp/PRIVACY_POLICY';
export const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.coinflow.app';

/** localStorage access that never throws (quota, private mode, disabled storage). */
export const safeStorage = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string): boolean {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },
  remove(key: string) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};
