import type { ExpoConfig, ConfigContext } from '@expo/config';
import { BRANDING } from './src/constants/branding';

/**
 * Config Expo dynamique. Le nom/bundle proviennent de src/constants/branding.ts
 * (point unique de renommage). Les variantes d'environnement (dev/staging/prod)
 * sont pilotées par APP_ENV et EAS (voir eas.json).
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const appEnv = process.env.EXPO_PUBLIC_APP_ENV ?? 'development';
  const isProd = appEnv === 'production';
  const suffix = isProd ? '' : ` (${appEnv[0].toUpperCase()})`;

  return {
    ...config,
    name: `${BRANDING.appName}${suffix}`,
    slug: BRANDING.slug,
    scheme: BRANDING.scheme,
    version: '0.1.0',
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: false,
      bundleIdentifier: isProd
        ? BRANDING.iosBundleIdentifier
        : `${BRANDING.iosBundleIdentifier}.${appEnv}`,
      // Apple Sign-In requis si l'on propose Google Sign-In (voir docs/APP_STORE.md).
    },
    android: {
      package: isProd
        ? BRANDING.androidPackage
        : `${BRANDING.androidPackage}.${appEnv}`,
    },
    plugins: ['expo-router', 'expo-secure-store'],
    experiments: { typedRoutes: true },
    extra: {
      appEnv,
      // eas.projectId sera renseigné par `eas init`.
    },
  };
};
