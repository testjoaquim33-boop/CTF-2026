import { supabase } from './supabase';
import { detectNewPRs, type PersonalRecordType } from '@project_fit/shared';
import type { ActiveExercise } from '../store/activeWorkout';
import { awardWorkoutXp } from './gamification';
import { fetchAchievements } from './achievements';

export interface FinishResult {
  ok: boolean;
  error?: string;
  workoutId?: string;
  newPRs?: { exerciseName: string; type: PersonalRecordType; value: number; unit: string }[];
  newBadges?: { name: string; icon: string | null }[];
}

/**
 * Persiste une séance terminée : workout + workout_exercises + sets, puis
 * détecte et enregistre les nouveaux records personnels.
 * `clientUuid` assure l'idempotence (une reprise offline ne duplique pas).
 */
export async function finishWorkout(params: {
  name: string;
  startedAt: number | null;
  clientUuid: string;
  exercises: ActiveExercise[];
}): Promise<FinishResult> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return { ok: false, error: 'not_authenticated' };

  const startedAtIso = params.startedAt ? new Date(params.startedAt).toISOString() : new Date().toISOString();

  // 1) Workout (idempotent via unique (user_id, client_uuid))
  const { data: workout, error: wErr } = await supabase
    .from('workouts')
    .upsert(
      {
        user_id: userId,
        name: params.name || 'Séance',
        status: 'completed',
        started_at: startedAtIso,
        completed_at: new Date().toISOString(),
        client_uuid: params.clientUuid,
      },
      { onConflict: 'user_id,client_uuid' },
    )
    .select('id')
    .single();
  if (wErr || !workout) return { ok: false, error: wErr?.message ?? 'workout_failed' };
  const workoutId = workout.id as string;

  const newPRs: NonNullable<FinishResult['newPRs']> = [];

  // 2) Par exercice : insérer workout_exercise + sets, puis PRs
  for (let i = 0; i < params.exercises.length; i++) {
    const ex = params.exercises[i];
    const { data: we, error: weErr } = await supabase
      .from('workout_exercises')
      .insert({ workout_id: workoutId, exercise_id: ex.exerciseId, order: i })
      .select('id')
      .single();
    if (weErr || !we) return { ok: false, error: weErr?.message ?? 'exercise_failed' };

    const setsRows = ex.sets.map((s, idx) => ({
      workout_exercise_id: we.id,
      set_number: idx + 1,
      weight_kg: s.weightKg,
      reps: s.reps,
      is_warmup: s.isWarmup ?? false,
      completed: s.completed,
    }));
    if (setsRows.length > 0) {
      const { error: sErr } = await supabase.from('sets').insert(setsRows);
      if (sErr) return { ok: false, error: sErr.message };
    }

    // 3) Records : meilleurs existants pour cet exercice
    const { data: existing } = await supabase
      .from('personal_records')
      .select('type,value')
      .eq('user_id', userId)
      .eq('exercise_id', ex.exerciseId);
    const previous: Partial<Record<PersonalRecordType, number>> = {};
    for (const r of existing ?? []) {
      const t = r.type as PersonalRecordType;
      previous[t] = Math.max(previous[t] ?? 0, Number(r.value));
    }

    const prs = detectNewPRs(ex.sets, previous);
    if (prs.length > 0) {
      const prRows = prs.map((pr) => ({
        user_id: userId,
        exercise_id: ex.exerciseId,
        type: pr.type,
        value: pr.value,
        unit: pr.unit,
      }));
      await supabase.from('personal_records').insert(prRows);
      prs.forEach((pr) => newPRs.push({ exerciseName: ex.name, ...pr }));
    }
  }

  const workingSets = params.exercises.reduce((n, ex) => n + ex.sets.filter((s) => !s.isWarmup).length, 0);
  await awardWorkoutXp({ userId, workingSets, newPRs: newPRs.length });

  // Badges : évaluation + persistance des nouveaux débloqués (best-effort :
  // ne doit jamais faire échouer l'enregistrement de la séance).
  let newBadges: { name: string; icon: string | null }[] = [];
  try {
    const res = await fetchAchievements();
    newBadges = res.newlyUnlocked.map((b) => ({ name: b.name, icon: b.icon }));
  } catch {
    // silencieux : les badges se resynchroniseront au prochain affichage.
  }

  return { ok: true, workoutId, newPRs, newBadges };
}

/** Historique des séances terminées (récentes d'abord). */
export async function fetchWorkoutHistory(limit = 20) {
  const { data, error } = await supabase
    .from('workouts')
    .select('id,name,started_at,completed_at,status')
    .eq('status', 'completed')
    .order('started_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
