import { fetchExercises } from './exercises';
import type { WorkoutCategory } from '../features/workout/categories';

export interface PickedExercise { id: string; name: string; name_fr: string | null }

/** Sélectionne des exercices correspondant à une catégorie (mélangés). */
export async function pickCategoryExercises(cat: WorkoutCategory): Promise<PickedExercise[]> {
  const all = await fetchExercises({});
  let pool = all.filter((e) => e.primary_muscle && cat.groups.includes(e.primary_muscle.group));
  if (cat.bodyweightOnly) {
    const bw = pool.filter((e) => e.is_bodyweight);
    if (bw.length >= 4) pool = bw;
  }
  // mélange léger + limite
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, cat.exerciseCount).map((e) => ({ id: e.id, name: e.name, name_fr: e.name_fr }));
}
