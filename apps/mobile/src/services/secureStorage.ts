import * as SecureStore from 'expo-secure-store';

/**
 * Adaptateur de stockage pour Supabase Auth basé sur expo-secure-store
 * (Keychain iOS / Keystore Android). Les tokens de session ne sont jamais
 * stockés en clair. SecureStore limite la taille des valeurs ; les JWT Supabase
 * restent bien en dessous.
 *
 * keychainAccessible = AFTER_FIRST_UNLOCK : le token reste lisible en tâche de
 * fond (rafraîchissement auto) même si l'écran est verrouillé après le premier
 * déverrouillage. Sans ça, iOS lève « User interaction is not allowed » lors du
 * refresh en arrière-plan. Les lectures sont protégées pour ne jamais faire
 * planter l'auth sur une erreur transitoire du trousseau.
 */
const opts = { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK };

export const secureStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value, opts);
    } catch {
      /* écriture best-effort : une erreur transitoire ne doit pas casser l'auth */
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      /* idem */
    }
  },
};
