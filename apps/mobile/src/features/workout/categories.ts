/**
 * Catégories de séance (cartes d'accueil "Séance"). Chaque catégorie pré-remplit
 * une séance avec des exercices des groupes musculaires visés.
 * L'image de fond = Storage `exercise-media/cat-<slug>.jpg` (fallback dégradé).
 */
export interface WorkoutCategory {
  slug: string;
  name: string;
  minutes: number;
  exerciseCount: number;
  groups: string[];        // groupes musculaires à piocher
  bodyweightOnly?: boolean;
  color: string;           // teinte de la carte
}

export const WORKOUT_CATEGORIES: WorkoutCategory[] = [
  { slug: 'haut-du-corps', name: 'Haut du corps', minutes: 45, exerciseCount: 8, groups: ['push', 'pull', 'arms'], color: '#7C5CFF' },
  { slug: 'bas-du-corps', name: 'Bas du corps', minutes: 50, exerciseCount: 7, groups: ['legs', 'posterior'], color: '#FF7A1A' },
  { slug: 'full-body', name: 'Full Body', minutes: 60, exerciseCount: 10, groups: ['push', 'pull', 'legs', 'core'], color: '#22C55E' },
  { slug: 'cardio-hiit', name: 'Cardio & HIIT', minutes: 30, exerciseCount: 12, groups: ['core', 'legs'], bodyweightOnly: true, color: '#3B82F6' },
];

export function categoryImageUrl(slug: string): string {
  return `https://yoaxsshvfkmzsamlxati.supabase.co/storage/v1/object/public/exercise-media/cat-${slug}.jpg`;
}
