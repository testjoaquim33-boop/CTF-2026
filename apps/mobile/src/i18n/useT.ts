import { useCallback } from 'react';
import { useSettings } from '../store/settings';
import { translations } from './translations';

export type TFunc = (key: string, vars?: Record<string, string | number>) => string;

/**
 * Hook de traduction. `t('profile.status', { status: 'active' })`.
 * Retombe sur le FR puis sur la clé brute si une traduction manque.
 */
export function useT(): TFunc {
  const lang = useSettings((s) => s.lang);
  return useCallback<TFunc>((key, vars) => {
    let s = translations[lang]?.[key] ?? translations.fr[key] ?? key;
    if (vars) {
      for (const k of Object.keys(vars)) s = s.replace(`{${k}}`, String(vars[k]));
    }
    return s;
  }, [lang]);
}
