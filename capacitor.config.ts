import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yanravel.app',
  appName: 'Yan Ravel',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
};

export default config;