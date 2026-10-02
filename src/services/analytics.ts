import { FirebaseAnalytics } from '@capacitor-firebase/analytics';
import { isNative } from './platform';

// Event names match v1. v1 only logged these to the console; v2 sends them to Firebase Analytics.
export type AnalyticsEvent =
  | 'onboarding_completed'
  | 'wallet_created'
  | 'wallet_updated'
  | 'wallet_deleted'
  | 'transaction_added'
  | 'transaction_updated'
  | 'transaction_deleted'
  | 'transfer_completed'
  | 'budget_created'
  | 'budget_deleted'
  | 'goal_created'
  | 'goal_funded'
  | 'goal_deleted'
  | 'recurring_created'
  | 'pin_set'
  | 'pin_skipped'
  | 'data_exported'
  | 'data_imported'
  | 'data_cleared'
  | 'screen_view';

type Params = Record<string, string | number | boolean | undefined>;

export const track = (event: AnalyticsEvent, params?: Params) => {
  if (import.meta.env.DEV) console.debug('[analytics]', event, params ?? '');
  // Only the installed Android app reports; the browser preview has no Firebase project attached.
  if (!isNative) return;
  const clean: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(params ?? {})) {
    if (v === undefined) continue;
    clean[k] = typeof v === 'boolean' ? (v ? 1 : 0) : v;
  }
  if (event === 'screen_view') {
    void FirebaseAnalytics.setCurrentScreen({ screenName: String(clean.screen ?? '') }).catch(() => undefined);
    return;
  }
  void FirebaseAnalytics.logEvent({ name: event, params: clean }).catch(() => undefined);
};
