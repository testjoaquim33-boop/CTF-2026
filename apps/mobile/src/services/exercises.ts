import { supabase } from './supabase';
import type { Level } from '@project_fit/shared';

export interface ExerciseListItem {
  id: string;
  slug: string;
  name: string;
  level: Level;
  is_bodyweight: boolean;
  primary_muscle: { slug: string; name: string; group: string } | null;
}

export interface ExerciseDetail extends ExerciseListItem {
  description: string | null;
  instructions: string[];
  common_mistakes: string[];
  difficulty: number;
  video_url: string | null;
  image_url: string | null;
}

export interface ExerciseFilters {
  muscleGroup?: string;
  level?: Level;
  search?: string;
}

/** Liste les exercices actifs, filtrable. Lecture autorisée (contenu public authentifié). */
export async function fetchExercises(filters: ExerciseFilters = {}): Promise<ExerciseListItem[]> {
  let query = supabase
    .from('exercises')
    .select('id,slug,name,level,is_bodyweight,primary_muscle:muscles!primary_muscle_id(slug,name,group)')
    .eq('is_active', true)
    .order('name');

  if (filters.level) query = query.eq('level', filters.level);
  if (filters.search) query = query.ilike('name', `%${filters.search}%`);

  const { data, error } = await query;
  if (error) throw error;
  const rows = (data ?? []) as unknown as ExerciseListItem[];
  // Filtre par groupe musculaire côté client (le join rend le filtre SQL verbeux).
  return filters.muscleGroup
    ? rows.filter((r) => r.primary_muscle?.group === filters.muscleGroup)
    : rows;
}

export async function fetchExerciseById(id: string): Promise<ExerciseDetail | null> {
  const { data, error } = await supabase
    .from('exercises')
    .select('id,slug,name,level,is_bodyweight,description,instructions,common_mistakes,difficulty,video_url,image_url,primary_muscle:muscles!primary_muscle_id(slug,name,group)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return (data as unknown as ExerciseDetail) ?? null;
}
