import * as SecureStore from 'expo-secure-store';

/**
 * Adaptateur de stockage pour Supabase Auth basé sur expo-secure-store
 * (Keychain iOS / Keystore Android). Les tokens de session ne sont jamais
 * stockés en clair. SecureStore limite la taille des valeurs ; les JWT Supabase
 * restent bien en dessous.
 */
export const secureStorageAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};
