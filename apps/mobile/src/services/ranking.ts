import { supabase } from './supabase';

export interface MyEntry {
  exercise_id: string;
  exerciseName: string;
  best_score: number;
  best_e1rm: number | null;
  rankSlug: string | null;
}
export interface PublicRow {
  display_name: string | null;
  best_score: number;
  rankSlug: string | null;
}

export async function submitToLeaderboard(exerciseId: string): Promise<{ ok: boolean; error?: string; rank?: string | null; score?: number }> {
  const { data, error } = await supabase.functions.invoke('leaderboard-submit', { body: { exerciseId } });
  if (error) {
    const ctx = (data ?? {}) as { error?: string };
    return { ok: false, error: ctx.error ?? error.message };
  }
  const d = data as { error?: string; rank?: string | null; score?: number };
  if (d.error) return { ok: false, error: d.error };
  return { ok: true, rank: d.rank ?? null, score: d.score };
}

export async function fetchMyEntries(): Promise<MyEntry[]> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return [];
  const { data, error } = await supabase
    .from('leaderboard_entries')
    .select('exercise_id,best_score,best_e1rm,exercise:exercises!exercise_id(name),rank:ranks!rank_id(slug)')
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    exercise_id: r.exercise_id as string,
    exerciseName: (r as unknown as { exercise?: { name?: string } }).exercise?.name ?? '—',
    best_score: Number(r.best_score),
    best_e1rm: r.best_e1rm != null ? Number(r.best_e1rm) : null,
    rankSlug: (r as unknown as { rank?: { slug?: string } }).rank?.slug ?? null,
  }));
}

export async function fetchPublicLeaderboard(exerciseId: string, limit = 50): Promise<PublicRow[]> {
  const { data, error } = await supabase
    .from('public_leaderboard')
    .select('display_name,best_score,rank_id,ranks:rank_id(slug)')
    .eq('exercise_id', exerciseId)
    .order('best_score', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    display_name: (r.display_name as string) ?? null,
    best_score: Number(r.best_score),
    rankSlug: (r as unknown as { ranks?: { slug?: string } }).ranks?.slug ?? null,
  }));
}
