import { supabase } from './supabase';
import { levelForXp, xpForWorkout, computeStreak, type LevelRow } from '@project_fit/shared';

/**
 * Attribue l'XP d'une séance terminée et met à jour niveau + streak.
 * Idempotence best-effort : appelé une fois à la fin de la séance.
 */
export async function awardWorkoutXp(params: { userId: string; workingSets: number; newPRs: number }) {
  const gained = xpForWorkout({ workingSets: params.workingSets, newPRs: params.newPRs });
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: stats }, { data: levels }] = await Promise.all([
    supabase.from('user_stats').select('xp,streak_days,last_active_date').eq('user_id', params.userId).maybeSingle(),
    supabase.from('levels').select('level,min_xp,title'),
  ]);

  const newXp = (stats?.xp ?? 0) + gained;
  const levelRows: LevelRow[] = (levels ?? []).map((l) => ({ level: l.level, minXp: l.min_xp, title: l.title }));
  const level = levelForXp(newXp, levelRows).level;
  const streak = computeStreak(stats?.last_active_date ?? null, today, stats?.streak_days ?? 0);

  await supabase.from('user_stats').upsert(
    { user_id: params.userId, xp: newXp, level, streak_days: streak, last_active_date: today },
    { onConflict: 'user_id' },
  );
  await supabase.from('xp_events').insert({ user_id: params.userId, type: 'workout', xp: gained });

  return { gained, newXp, level, streak };
}

export interface HomeStats {
  level: number; title: string; progress: number; xp: number; streak: number;
}

export async function fetchHomeStats(): Promise<HomeStats> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error('not_authenticated');
  const [{ data: stats }, { data: levels }] = await Promise.all([
    supabase.from('user_stats').select('xp,level,streak_days').eq('user_id', userId).maybeSingle(),
    supabase.from('levels').select('level,min_xp,title'),
  ]);
  const xp = stats?.xp ?? 0;
  const levelRows: LevelRow[] = (levels ?? []).map((l) => ({ level: l.level, minXp: l.min_xp, title: l.title }));
  const st = levelForXp(xp, levelRows);
  return { level: st.level, title: st.title, progress: st.progress, xp, streak: stats?.streak_days ?? 0 };
}
