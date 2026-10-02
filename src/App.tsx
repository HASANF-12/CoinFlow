import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { App as CapApp } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import type { Transaction } from './domain/types';
import { t, tn } from './i18n';
import { hideBanner, initAds, onBannerHeight, showBanner } from './services/ads';
import { track } from './services/analytics';
import { rescheduleReminders } from './services/notifications';
import { isNative } from './services/platform';
import { flushData } from './services/storage';
import { NavContext, type EditorRequest, type Nav, type PlanSection, type Tab } from './state/nav';
import { useStore } from './state/store';
import { Activity } from './screens/Activity';
import { Home } from './screens/Home';
import { Lock } from './screens/Lock';
import { Onboarding } from './screens/Onboarding';
import { Plan } from './screens/Plan';
import { FirstEntryPrompt, WhatsNew } from './screens/Prompts';
import { Settings } from './screens/Settings';
import { TransactionDetail } from './screens/TransactionDetail';
import { TransactionEditor } from './screens/TransactionEditor';
import { Wallets } from './screens/Wallets';
import { handleBack, useOverlayOpen } from './ui/back';
import { BottomNav } from './ui/BottomNav';
import { useToast } from './ui/Toast';

/** Re-lock when the app comes back after this long in the background. */
const RELOCK_AFTER_MS = 60_000;
/** Screens that show a banner. Home, the editor and settings stay ad-free. */
const AD_TABS: Tab[] = ['activity', 'plan', 'wallets'];

export const App = () => {
  const store = useStore();
  const { ready, data, dispatch, startup } = store;
  const user = data.user;
  const toast = useToast();

  const [locked, setLocked] = useState(true);
  const [tab, setTab] = useState<Tab>('home');
  const [planSection, setPlanSection] = useState<PlanSection>('budgets');
  const [editor, setEditor] = useState<EditorRequest | null>(null);
  const [detail, setDetail] = useState<Transaction | null>(null);
  const [firstPrompt, setFirstPrompt] = useState(false);
  const [whatsNew, setWhatsNew] = useState(false);
  const overlayOpen = useOverlayOpen();
  const navRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLElement>(null);

  // Decide the initial lock state once data is loaded.
  useEffect(() => {
    if (ready) setLocked(!!data.user?.pinHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  useEffect(() => {
    if (!ready || !isNative) return;
    void SplashScreen.hide().catch(() => undefined);
    void StatusBar.setStyle({ style: Style.Dark }).catch(() => undefined);
  }, [ready]);

  // Per-session housekeeping once the user is known.
  const sessionStarted = useRef(false);
  useEffect(() => {
    if (!ready || !user || sessionStarted.current) return;
    sessionStarted.current = true;
    dispatch({ type: 'setUser', patch: { lastOpenDate: Date.now() } });
    void rescheduleReminders({ enabled: user.notificationsEnabled, reminderHour: user.reminderHour, name: user.name });
    void initAds();
    if (startup.migratedFromV1) setWhatsNew(true);
    if (startup.recurringCreated > 0) toast({ message: tn('toast.recurringAdded', startup.recurringCreated) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user]);

  // Android lifecycle: save on background, re-lock after a while, hardware back button.
  const backgroundedAt = useRef(0);
  const tabRef = useRef(tab);
  tabRef.current = tab;
  useEffect(() => {
    if (!isNative) return;
    const subs = [
      CapApp.addListener('appStateChange', ({ isActive }) => {
        if (!isActive) {
          backgroundedAt.current = Date.now();
          void flushData();
        } else if (backgroundedAt.current && Date.now() - backgroundedAt.current > RELOCK_AFTER_MS) {
          setLocked((l) => l || !!storeUserRef.current?.pinHash);
        }
      }),
      CapApp.addListener('backButton', () => {
        if (handleBack()) return;
        if (tabRef.current !== 'home') setTab('home');
        else void CapApp.minimizeApp();
      }),
    ];
    return () => subs.forEach((s) => void s.then((h) => h.remove()));
  }, []);
  const storeUserRef = useRef(user);
  storeUserRef.current = user;

  // Banner placement: just above the bottom nav, hidden whenever a sheet would be covered.
  const showAds = ready && !!user && !locked && AD_TABS.includes(tab) && !overlayOpen && !editor;
  useLayoutEffect(() => {
    if (!isNative) return;
    if (!showAds) {
      void hideBanner();
      return;
    }
    const nav = navRef.current;
    const margin = nav ? Math.round(window.innerHeight - nav.getBoundingClientRect().top) : 80;
    void showBanner(margin);
  }, [showAds]);
  useEffect(
    () =>
      onBannerHeight((h) => {
        document.documentElement.style.setProperty('--ad-h', `${h}px`);
      }),
    [],
  );
  useEffect(() => {
    if (!showAds) document.documentElement.style.setProperty('--ad-h', '0px');
  }, [showAds]);

  const go = useCallback((next: Tab, section?: PlanSection) => {
    if (section) setPlanSection(section);
    setTab(next);
    scrollRef.current?.scrollTo({ top: 0 });
  }, []);

  useEffect(() => track('screen_view', { screen: tab }), [tab]);

  const nav: Nav = useMemo(
    () => ({ tab, go, planSection, openEditor: (req) => setEditor(req ?? {}), openTransaction: setDetail }),
    [tab, go, planSection],
  );

  const onSaved = (tx: Transaction | null) => {
    const wasFirst = data.transactions.length === 0;
    setEditor(null);
    if (tx && !editor?.tx) toast({ message: tx.type === 'income' ? t('toast.incomeSaved') : t('toast.expenseSaved') });
    if (wasFirst && user && !user.pinPromptSeen) setTimeout(() => setFirstPrompt(true), 600);
  };

  if (!ready) return <div className="h-full bg-bg" />;
  if (!user) return <Onboarding />;
  if (locked && user.pinHash)
    return (
      <Lock
        onUnlock={(pinRemoved) => {
          setLocked(false);
          if (pinRemoved) toast({ message: t('lock.pinRemovedToast') });
        }}
      />
    );

  return (
    <NavContext.Provider value={nav}>
      <main ref={scrollRef} className="mx-auto h-full max-w-lg overflow-y-auto px-5 pt-safe pb-nav">
        {tab === 'home' && <Home />}
        {tab === 'activity' && <Activity />}
        {tab === 'plan' && <Plan />}
        {tab === 'wallets' && <Wallets />}
        {tab === 'settings' && <Settings />}
      </main>
      <BottomNav ref={navRef} tab={tab} onTab={go} onAdd={() => setEditor({})} />
      <TransactionEditor request={editor} onClose={() => setEditor(null)} onSaved={onSaved} />
      <TransactionDetail tx={detail} onClose={() => setDetail(null)} />
      <FirstEntryPrompt open={firstPrompt} onClose={() => setFirstPrompt(false)} />
      <WhatsNew open={whatsNew} onClose={() => setWhatsNew(false)} />
    </NavContext.Provider>
  );
};
