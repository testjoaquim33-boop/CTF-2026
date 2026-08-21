/**
 * Config runtime publique (préfixe EXPO_PUBLIC_ uniquement).
 * Aucune valeur sensible ici. Les secrets vivent côté Edge Functions.
 */
export type AppEnv = 'development' | 'staging' | 'production';

function req(name: string, value: string | undefined): string {
  if (!value || value.length === 0) {
    // En dev on veut un message clair ; en prod, EAS injecte les valeurs.
    throw new Error(`Missing required env var: ${name}. See .env.example`);
  }
  return value;
}

export const config = {
  appEnv: (process.env.EXPO_PUBLIC_APP_ENV ?? 'development') as AppEnv,
  supabaseUrl: req('EXPO_PUBLIC_SUPABASE_URL', process.env.EXPO_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: req('EXPO_PUBLIC_SUPABASE_ANON_KEY', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY),
  revenueCat: {
    iosKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '',
    androidKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '',
  },
  posthog: {
    key: process.env.EXPO_PUBLIC_POSTHOG_KEY ?? '',
    host: process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://eu.posthog.com',
  },
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? '',
} as const;
