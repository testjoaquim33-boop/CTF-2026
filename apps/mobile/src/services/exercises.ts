import { supabase } from './supabase';
import type { Level } from '@project_fit/shared';

export interface ExerciseListItem {
  id: string;
  slug: string;
  name: string;
  name_fr: string | null;
  level: Level;
  is_bodyweight: boolean;
  primary_muscle: { slug: string; name: string; group: string } | null;
}

export interface ExerciseDetail extends ExerciseListItem {
  description: string | null;
  description_fr: string | null;
  instructions: string[];
  instructions_fr: string[] | null;
  common_mistakes: string[];
  common_mistakes_fr: string[] | null;
  difficulty: number;
  video_url: string | null;
  image_url: string | null;
}

export interface ExerciseFilters {
  muscleGroup?: string;
  level?: Level;
  search?: string;
}

// Les colonnes i18n (name_fr, …) n'existent qu'après le patch SQL 0009.
// On détecte leur présence une fois et on retombe proprement sur l'anglais tant
// qu'elles manquent — l'app ne plante jamais si la migration n'est pas appliquée.
let hasI18nColumns: boolean | null = null;
const UNDEFINED_COLUMN = '42703';

const LIST_COLS_I18N = 'id,slug,name,name_fr,level,is_bodyweight,primary_muscle:muscles!primary_muscle_id(slug,name,group)';
const LIST_COLS_BASE = 'id,slug,name,level,is_bodyweight,primary_muscle:muscles!primary_muscle_id(slug,name,group)';
const DETAIL_COLS_I18N = 'id,slug,name,name_fr,level,is_bodyweight,description,description_fr,instructions,instructions_fr,common_mistakes,common_mistakes_fr,difficulty,video_url,image_url,primary_muscle:muscles!primary_muscle_id(slug,name,group)';
const DETAIL_COLS_BASE = 'id,slug,name,level,is_bodyweight,description,instructions,common_mistakes,difficulty,video_url,image_url,primary_muscle:muscles!primary_muscle_id(slug,name,group)';

/** Liste les exercices actifs, filtrable. Lecture autorisée (contenu public authentifié). */
export async function fetchExercises(filters: ExerciseFilters = {}): Promise<ExerciseListItem[]> {
  const run = async (withI18n: boolean) => {
    let q = supabase
      .from('exercises')
      .select(withI18n ? LIST_COLS_I18N : LIST_COLS_BASE)
      .eq('is_active', true)
      .order('name');
    if (filters.level) q = q.eq('level', filters.level);
    if (filters.search) {
      q = withI18n
        ? q.or(`name.ilike.%${filters.search}%,name_fr.ilike.%${filters.search}%`)
        : q.ilike('name', `%${filters.search}%`);
    }
    return q;
  };

  let { data, error } = await run(hasI18nColumns !== false);
  if (error && error.code === UNDEFINED_COLUMN && hasI18nColumns !== false) {
    hasI18nColumns = false;
    ({ data, error } = await run(false));
  } else if (!error && hasI18nColumns === null) {
    hasI18nColumns = true;
  }
  if (error) throw error;

  const rows = (data ?? []).map((r) => ({ name_fr: null, ...(r as Record<string, unknown>) })) as unknown as ExerciseListItem[];
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
  const run = (withI18n: boolean) => supabase
    .from('exercises')
    .select(withI18n ? DETAIL_COLS_I18N : DETAIL_COLS_BASE)
    .eq('id', id)
    .single();

  let { data, error } = await run(hasI18nColumns !== false);
  if (error && error.code === UNDEFINED_COLUMN && hasI18nColumns !== false) {
    hasI18nColumns = false;
    ({ data, error } = await run(false));
  } else if (!error && hasI18nColumns === null) {
    hasI18nColumns = true;
  }
  if (error) throw error;
  if (!data) return null;
  // Colonnes FR absentes -> null (repli EN géré par l'app).
  return { name_fr: null, description_fr: null, instructions_fr: null, common_mistakes_fr: null, ...(data as Record<string, unknown>) } as unknown as ExerciseDetail;
}
