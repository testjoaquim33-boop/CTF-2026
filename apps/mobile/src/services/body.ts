import { supabase } from './supabase';

export interface WeighIn { date: string; weightKg: number; bodyFatPct: number | null }

/** Dernière pesée de l'utilisateur (ou null). Données privées (RLS owner). */
export async function fetchLatestWeight(): Promise<WeighIn | null> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return null;
  const { data } = await supabase.from('body_metrics')
    .select('date,weight_kg,body_fat_pct')
    .eq('user_id', userId).order('date', { ascending: false }).limit(1).maybeSingle();
  if (!data) return null;
  return { date: data.date as string, weightKg: Number(data.weight_kg), bodyFatPct: data.body_fat_pct != null ? Number(data.body_fat_pct) : null };
}

/**
 * Enregistre une pesée (une par jour, upsert sur (user_id, date)).
 * Écriture directe autorisée : c'est une donnée privée de l'utilisateur
 * (RLS owner + contrainte 20–500 kg en base). Aucune fonction serveur requise.
 */
export async function logBodyWeight(weightKg: number, opts: { date?: string; bodyFatPct?: number | null } = {}): Promise<{ ok: boolean; error?: string }> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return { ok: false, error: 'not_authenticated' };
  if (!(weightKg >= 20 && weightKg <= 500)) return { ok: false, error: 'invalid_weight' };
  const date = opts.date ?? new Date().toISOString().slice(0, 10);
  const row: Record<string, unknown> = { user_id: userId, date, weight_kg: Math.round(weightKg * 100) / 100 };
  if (opts.bodyFatPct != null && opts.bodyFatPct > 0) row.body_fat_pct = opts.bodyFatPct;
  const { error } = await supabase.from('body_metrics').upsert(row, { onConflict: 'user_id,date' });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
