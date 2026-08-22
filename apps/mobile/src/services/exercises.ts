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

export interface ExerciseHistorySet { weightKg: number; reps: number; isWarmup: boolean }
export interface ExerciseHistoryDay { date: string; sets: ExerciseHistorySet[] }
export interface ExercisePR { type: string; value: number; unit: string; achievedAt: string }

/** Historique des séries de l'utilisateur pour un exercice, groupé par jour. */
export async function fetchExerciseHistory(exerciseId: string, limit = 80): Promise<ExerciseHistoryDay[]> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return [];
  const { data, error } = await supabase
    .from('sets')
    .select('weight_kg,reps,is_warmup,logged_at,workout_exercises!inner(exercise_id,workouts!inner(user_id))')
    .eq('workout_exercises.exercise_id', exerciseId)
    .eq('workout_exercises.workouts.user_id', userId)
    .order('logged_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  const byDay = new Map<string, ExerciseHistorySet[]>();
  for (const r of (data ?? []) as Array<Record<string, unknown>>) {
    const day = String(r.logged_at).slice(0, 10);
    const arr = byDay.get(day) ?? [];
    arr.push({ weightKg: Number(r.weight_kg), reps: Number(r.reps), isWarmup: Boolean(r.is_warmup) });
    byDay.set(day, arr);
  }
  return [...byDay.entries()].map(([date, sets]) => ({ date, sets }));
}

/** Records personnels de l'utilisateur pour un exercice. */
export async function fetchExerciseRecords(exerciseId: string): Promise<ExercisePR[]> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return [];
  const { data, error } = await supabase
    .from('personal_records')
    .select('type,value,unit,achieved_at')
    .eq('user_id', userId)
    .eq('exercise_id', exerciseId)
    .order('achieved_at', { ascending: false });
  if (error) throw error;
  // Garde le meilleur par type.
  const best = new Map<string, ExercisePR>();
  for (const r of data ?? []) {
    const type = r.type as string;
    const pr: ExercisePR = { type, value: Number(r.value), unit: (r.unit as string) ?? 'kg', achievedAt: r.achieved_at as string };
    const cur = best.get(type);
    if (!cur || pr.value > cur.value) best.set(type, pr);
  }
  return [...best.values()];
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
