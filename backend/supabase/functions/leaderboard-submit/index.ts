// ============================================================================
// Edge Function : leaderboard-submit
// Écrit une entrée de classement APRÈS anti-triche. Écriture serveur only
// (le client ne peut jamais écrire dans leaderboard_entries — RLS).
//
// Score = force relative = meilleur 1RM estimé / poids de corps.
// Rang déterminé par les seuils EN BASE (rank_thresholds), par sexe.
// Déploiement : supabase functions deploy leaderboard-submit
// ============================================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS intégré (fonction autonome : déployable par simple collage dans le
// Dashboard Supabase, sans dépendre d'un fichier partagé).
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'unauthorized' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const userClient = createClient(supabaseUrl, serviceKey, { global: { headers: { Authorization: authHeader } } });
  const { data: userData, error: uErr } = await userClient.auth.getUser();
  if (uErr || !userData.user) return json({ error: 'unauthorized' }, 401);
  const userId = userData.user.id;

  const body = await req.json().catch(() => ({}));
  const exerciseId: string | undefined = body?.exerciseId;
  if (!exerciseId) return json({ error: 'missing_exercise' }, 400);

  const admin = createClient(supabaseUrl, serviceKey);

  // Poids de corps le plus récent — REQUIS (score = force relative = charge/poids).
  // On le vérifie en premier : c'est le blocage le plus courant, et le message
  // « ajoute ta pesée » est le plus actionnable pour l'utilisateur.
  const { data: bw } = await admin.from('body_metrics').select('weight_kg')
    .eq('user_id', userId).order('date', { ascending: false }).limit(1).maybeSingle();
  const bodyweight = bw ? Number(bw.weight_kg) : 0;
  if (!(bodyweight >= 30) || bodyweight > 400) return json({ error: 'implausible_bodyweight' }, 422);

  // L'exercice est-il au poids du corps ? (pompes, tractions, dips…)
  const { data: exRow } = await admin.from('exercises').select('is_bodyweight').eq('id', exerciseId).maybeSingle();
  const isBodyweight = !!exRow?.is_bodyweight;

  // Meilleure série de travail (charge ajoutée max) pour l'anti-triche
  const { data: sets } = await admin.from('sets')
    .select('weight_kg,reps,is_warmup,workout_exercises!inner(exercise_id,workouts!inner(user_id))')
    .eq('workout_exercises.exercise_id', exerciseId)
    .eq('workout_exercises.workouts.user_id', userId)
    .eq('is_warmup', false)
    .order('weight_kg', { ascending: false }).limit(1);
  const top = (sets ?? [])[0] as { weight_kg: number; reps: number } | undefined;
  if (!top) return json({ error: 'no_data' }, 400);

  // Charge effective soulevée : pour un exercice au poids du corps, la
  // résistance = poids de corps + charge ajoutée (lest). Sinon, charge externe.
  const addedLoad = Number(top.weight_kg);
  const reps = Number(top.reps);
  const effectiveLoad = isBodyweight ? bodyweight + addedLoad : addedLoad;

  // ANTI-TRICHE (bornes de plausibilité) sur la charge effective
  const err = validatePerformance(effectiveLoad, reps, bodyweight);
  if (err) return json({ error: err }, 422);

  // Meilleur 1RM estimé. Pour un exercice au poids du corps, on l'estime
  // directement depuis la charge effective (le PR stocké n'inclut pas le poids
  // de corps). Sinon on prend le meilleur PR est_1rm si disponible.
  let bestE1rm = estimateE1rm(effectiveLoad, reps);
  if (!isBodyweight) {
    const { data: prs } = await admin.from('personal_records')
      .select('value').eq('user_id', userId).eq('exercise_id', exerciseId).eq('type', 'est_1rm')
      .order('value', { ascending: false }).limit(1).maybeSingle();
    if (prs) bestE1rm = Number(prs.value);
  }
  const score = bestE1rm / bodyweight;

  // Sexe (pour les seuils)
  const { data: profile } = await admin.from('profiles').select('sex').eq('id', userId).maybeSingle();
  const sex = profile?.sex ?? 'unspecified';

  // Seuils : spécifiques à l'exercice sinon globaux (exercise_id null), métrique force relative
  const { data: thExercise } = await admin.from('rank_thresholds')
    .select('rank_id,min_value,max_value,ranks!inner(slug)')
    .eq('exercise_id', exerciseId).eq('sex', sex).eq('metric', 'relative_strength');
  let thresholds = thExercise ?? [];
  if (thresholds.length === 0) {
    const { data: thGlobal } = await admin.from('rank_thresholds')
      .select('rank_id,min_value,max_value,ranks!inner(slug)')
      .is('exercise_id', null).eq('sex', sex).eq('metric', 'relative_strength');
    thresholds = thGlobal ?? [];
  }

  let rankId: string | null = null;
  let rankSlug: string | null = null;
  for (const t of thresholds as Array<{ rank_id: string; min_value: number; max_value: number | null; ranks: { slug: string } }>) {
    const upper = t.max_value ?? Infinity;
    if (score >= Number(t.min_value) && score < Number(upper)) { rankId = t.rank_id; rankSlug = t.ranks.slug; break; }
  }

  await admin.from('leaderboard_entries').upsert({
    user_id: userId, exercise_id: exerciseId, best_score: round4(score), best_e1rm: round2(bestE1rm),
    bodyweight_kg: bodyweight, rank_id: rankId, category: 'overall', verified: true,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,exercise_id,category' });

  return json({ score: round4(score), best_e1rm: round2(bestE1rm), rank: rankSlug }, 200);
});

function validatePerformance(weightKg: number, reps: number, bodyweightKg: number): string | null {
  if (!(weightKg > 0) || weightKg > 600) return 'implausible_weight';
  if (!(reps > 0) || reps > 100) return 'implausible_reps';
  if (!(bodyweightKg >= 30) || bodyweightKg > 400) return 'implausible_bodyweight';
  if (weightKg / bodyweightKg > 6) return 'implausible_relative_strength';
  return null;
}
function estimateE1rm(w: number, r: number): number { return r === 1 ? w : w * (1 + r / 30); }
function round2(n: number): number { return Math.round(n * 100) / 100; }
function round4(n: number): number { return Math.round(n * 10000) / 10000; }
function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
