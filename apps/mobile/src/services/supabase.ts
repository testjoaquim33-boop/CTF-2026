import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { config } from './config';
import { secureStorageAdapter } from './secureStorage';

/**
 * Client Supabase (anon key — conçue pour être publique, protégée par RLS).
 * Session persistée dans SecureStore. autoRefreshToken géré par le SDK.
 */
export const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
  auth: {
    storage: secureStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // pas de flux OAuth par URL en natif
  },
});
