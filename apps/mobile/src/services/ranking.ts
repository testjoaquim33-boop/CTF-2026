import { supabase } from './supabase';

export interface MyEntry {
  exercise_id: string;
  name: string;
  name_fr: string | null;
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
    // Les erreurs HTTP (non-2xx) rangent le corps de réponse dans error.context.
    // On tente d'en extraire le code métier (ex. 'implausible_bodyweight') pour
    // afficher un message clair, sinon on retombe sur data puis le message brut.
    let code: string | undefined = (data as { error?: string } | null)?.error;
    const ctx = (error as { context?: Response }).context;
    if (!code && ctx && typeof ctx.json === 'function') {
      try { code = (await ctx.json())?.error; } catch { /* corps non-JSON */ }
    }
    return { ok: false, error: code ?? error.message };
  }
  const d = data as { error?: string; rank?: string | null; score?: number };
  if (d.error) return { ok: false, error: d.error };
  return { ok: true, rank: d.rank ?? null, score: d.score };
}

export async function fetchMyEntries(): Promise<MyEntry[]> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return [];
  const run = (cols: string) => supabase.from('leaderboard_entries').select(cols).eq('user_id', userId);
  let res = await run('exercise_id,best_score,best_e1rm,exercise:exercises!exercise_id(name,name_fr),rank:ranks!rank_id(slug)');
  if (res.error && res.error.code === '42703') {
    res = await run('exercise_id,best_score,best_e1rm,exercise:exercises!exercise_id(name),rank:ranks!rank_id(slug)');
  }
  if (res.error) throw res.error;
  return (res.data ?? []).map((r) => {
    const ex = (r as unknown as { exercise?: { name?: string; name_fr?: string | null } }).exercise;
    return {
      exercise_id: r.exercise_id as string,
      name: ex?.name ?? '—', name_fr: ex?.name_fr ?? null,
      best_score: Number(r.best_score),
      best_e1rm: r.best_e1rm != null ? Number(r.best_e1rm) : null,
      rankSlug: (r as unknown as { rank?: { slug?: string } }).rank?.slug ?? null,
    };
  });
}

/**
 * Recalcule le rang de TOUS les exercices déjà travaillés (ceux ayant au moins
 * un record personnel). Utile pour classer l'historique existant sans refaire
 * une séance. Best-effort : chaque exo est soumis côté serveur (anti-triche),
 * les échecs (pas de pesée, non classable…) sont ignorés.
 * Retourne le nombre d'exercices classés avec succès.
 */
export async function recomputeMyRanks(): Promise<{ ranked: number; total: number }> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return { ranked: 0, total: 0 };
  const { data } = await supabase.from('personal_records')
    .select('exercise_id').eq('user_id', userId);
  const ids = Array.from(new Set((data ?? []).map((r) => r.exercise_id as string)));
  const results = await Promise.allSettled(ids.map((id) => submitToLeaderboard(id)));
  const ranked = results.filter((r) => r.status === 'fulfilled' && r.value.ok && r.value.rank).length;
  return { ranked, total: ids.length };
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
