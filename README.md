# CoinFlow

Offline-first expense tracker and budget planner for Android — [Google Play](https://play.google.com/store/apps/details?id=com.coinflow.app).

React 19 + TypeScript + Tailwind CSS 4, packaged for Android with Capacitor 8.

## Develop

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # unit tests (money maths, dates, v1 → v2 migration)
npm run typecheck
```

Dev-only helpers (stripped from production builds):

- `http://localhost:3000/?demo=v1` — loads sample data in the **v1.0.4 storage format**, exercising the real upgrade path.
- `http://localhost:3000/?demo=reset` — starts from a clean install.

## Android

Requires [Android Studio](https://developer.android.com/studio) (it includes the SDK and JDK).

```bash
npm run android:test     # build with AdMob *test* ads and copy into android/
npm run android:open     # open in Android Studio, then Run ▶ on a phone
```

Always test on your own phone with `android:test`. Viewing or clicking real ads on your own device can get the AdMob account suspended.

### Release

1. Copy `android/keystore.properties.example` to `android/keystore.properties` and fill in the upload key path and passwords. This file and all `*.jks` files are git-ignored.
2. Bump `versionCode` / `versionName` in `android/app/build.gradle` (scheme: `major*10000 + minor*100 + patch`).
3. `npm run android:release` (real ads), then in Android Studio: **Build → Generate Signed App Bundle** → upload the `.aab` to Play Console.

## Architecture

```
src/
  domain/     pure logic: types, currencies, money, dates, ledger (balances, stats, recurring), v1 migration
  services/   device & I/O: storage, rates, notifications, ads, receipts, backup/Excel, security
  state/      app store (reducer + actions) and navigation context
  ui/         design-system components (Sheet, PinPad, pickers, …)
  screens/    Home, Activity, Plan, Wallets, Settings, editor, onboarding, lock
  i18n/       strings (en.ts is the source; add a file per language)
```

Key decisions:

- **Balances are derived**, never stored: `openingBalance + Σ transactions`. Transfers and goal movements are ordinary transactions tagged `transferId` / `goalId`, excluded from income/spending totals.
- **Storage**: one JSON file in the app's private data directory, written atomically (temp file + rename), with daily snapshots kept for 7 days. Android Auto Backup copies it to the user's Google Drive (`android/app/src/main/res/xml/*backup*`).
- **v1 compatibility**: on first launch, v2 reads v1's WebView `localStorage` key `moneyflow_app_v1`, migrates it (opening balances are solved so every balance matches v1 exactly), and hashes the old plain-text PIN. The app id and WebView origin must not change or that data becomes unreachable.
- **Receipts** are compressed and saved as files, not inlined in the data (v1 inlined them and eventually hit WebView storage limits).
