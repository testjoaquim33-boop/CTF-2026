/** Groupes musculaires pour le filtre (dérivés du seed muscles). */
export const MUSCLE_GROUPS: { id: string; label: string }[] = [
  { id: 'push', label: 'Poussée' },
  { id: 'pull', label: 'Tirage' },
  { id: 'legs', label: 'Jambes' },
  { id: 'core', label: 'Core' },
  { id: 'posterior', label: 'Chaîne post.' },
  { id: 'arms', label: 'Bras' },
];

export const LEVEL_LABELS_SHORT: Record<string, string> = {
  beginner: 'Débutant', intermediate: 'Intermédiaire', advanced: 'Avancé',
};
