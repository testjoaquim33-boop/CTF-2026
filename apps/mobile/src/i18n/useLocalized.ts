import { useSettings } from '../store/settings';

/**
 * Sélection de contenu localisé (exercices) selon la langue courante.
 * Repli sur l'anglais (colonnes d'origine) si la traduction FR manque.
 */
export function useLocalized() {
  const lang = useSettings((s) => s.lang);
  function pick<T>(en: T, fr: T | null | undefined): T {
    return lang === 'fr' && fr != null && !(typeof fr === 'string' && fr === '') ? (fr as T) : en;
  }
  return {
    lang,
    pick,
    exName: (e: { name: string; name_fr?: string | null }) => pick(e.name, e.name_fr),
  };
}
