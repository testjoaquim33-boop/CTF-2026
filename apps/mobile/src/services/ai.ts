import { supabase } from './supabase';

export interface AiRecommendation {
  suggested_weight_kg: number;
  suggested_sets: number;
  suggested_reps_min: number;
  suggested_reps_max: number;
  rest_seconds: number;
  rationale: string;
  disclaimer: string;
}

export interface AiResult {
  ok: boolean;
  error?: string;
  recommendation?: AiRecommendation;
  safetyNotice?: string;
}

/** Demande une recommandation IA (proxy Edge Function sécurisé). */
export async function requestRecommendation(exerciseId: string, note = ''): Promise<AiResult> {
  const { data, error } = await supabase.functions.invoke('ai-recommendation', {
    body: { exerciseId, note },
  });
  if (error) {
    // Les erreurs applicatives (quota, config) reviennent dans data ; les erreurs réseau dans error.
    const ctx = (data ?? {}) as { error?: string; limit?: number };
    return { ok: false, error: ctx.error ?? error.message };
  }
  const d = data as { recommendation?: AiRecommendation; safety_notice?: string; error?: string };
  if (d.error) return { ok: false, error: d.error };
  if (d.safety_notice) return { ok: true, safetyNotice: d.safety_notice };
  return { ok: true, recommendation: d.recommendation ?? undefined };
}
