import type { CapacitorConfig } from '@capacitor/cli';

// appId and the default https://localhost origin must stay the same as v1.x,
// otherwise the WebView's localStorage (where v1 kept all user data) is not
// reachable and existing users lose their data on update.
const config: CapacitorConfig = {
  appId: 'com.coinflow.app',
  appName: 'CoinFlow',
  webDir: 'dist',
  android: {
    backgroundColor: '#07110f',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      backgroundColor: '#07110f',
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_notify',
      iconColor: '#2bb39a',
    },
  },
};

export default config;
