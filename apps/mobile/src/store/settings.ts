import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export type Lang = 'fr' | 'en';
const KEY = 'app_lang';

interface SettingsState {
  lang: Lang;
  hydrated: boolean;
  setLang: (lang: Lang) => void;
  hydrate: () => Promise<void>;
}

/** Préférence de langue (persistée localement via SecureStore). Défaut : FR. */
export const useSettings = create<SettingsState>((set) => ({
  lang: 'fr',
  hydrated: false,
  setLang: (lang) => {
    set({ lang });
    SecureStore.setItemAsync(KEY, lang).catch(() => {});
  },
  hydrate: async () => {
    try {
      const v = await SecureStore.getItemAsync(KEY);
      if (v === 'fr' || v === 'en') set({ lang: v });
    } catch {
      // ignore : on garde le défaut
    }
    set({ hydrated: true });
  },
}));
