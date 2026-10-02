import { AdMob, AdmobConsentStatus, BannerAdPluginEvents, BannerAdPosition, BannerAdSize } from '@capacitor-community/admob';
import { isNative } from './platform';

const BANNER_ID = 'ca-app-pub-5713204301714205/1973509253';
// Only release builds (vite --mode production) show real ads. Test builds on your own phone must use
// test ads: AdMob suspends accounts for clicks/impressions from the developer's own device.
const TESTING = import.meta.env.MODE !== 'production';

let ready: Promise<boolean> | null = null;
let privacyOptionsRequired = false;
let bannerState: 'none' | 'shown' | 'hidden' = 'none';
let lastMargin = -1;

/** Initializes AdMob and runs Google's consent flow (required for EEA/UK users). Safe to call repeatedly. */
export const initAds = (): Promise<boolean> => {
  if (!isNative) return Promise.resolve(false);
  ready ??= (async () => {
    try {
      await AdMob.initialize({ initializeForTesting: TESTING });
      let consent = await AdMob.requestConsentInfo();
      if (consent.status === AdmobConsentStatus.REQUIRED && consent.isConsentFormAvailable) {
        consent = await AdMob.showConsentForm();
      }
      privacyOptionsRequired = consent.privacyOptionsRequirementStatus === 'REQUIRED';
      return consent.canRequestAds;
    } catch (e) {
      console.warn('AdMob init failed', e);
      return false;
    }
  })();
  return ready;
};

/** Settings must offer a way to change ad consent when Google says it's required. */
export const needsPrivacyOptions = () => privacyOptionsRequired;
export const showPrivacyOptions = () => AdMob.showPrivacyOptionsForm().catch(() => undefined);

/** Shows the banner just above the bottom navigation. `marginDp` = distance from screen bottom. */
export const showBanner = async (marginDp: number) => {
  if (!(await initAds())) return;
  try {
    if (bannerState === 'none' || marginDp !== lastMargin) {
      if (bannerState !== 'none') await AdMob.removeBanner();
      await AdMob.showBanner({
        adId: BANNER_ID,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: marginDp,
        isTesting: TESTING,
      });
      lastMargin = marginDp;
    } else if (bannerState === 'hidden') {
      await AdMob.resumeBanner();
    }
    bannerState = 'shown';
  } catch (e) {
    console.warn('Banner failed', e);
  }
};

export const hideBanner = async () => {
  if (bannerState !== 'shown') return;
  bannerState = 'hidden';
  await AdMob.hideBanner().catch(() => undefined);
};

export const onBannerHeight = (cb: (heightDp: number) => void) => {
  if (!isNative) return () => {};
  const handle = AdMob.addListener(BannerAdPluginEvents.SizeChanged, (size) => cb(bannerState === 'shown' ? size.height : 0));
  return () => void handle.then((h) => h.remove());
};
