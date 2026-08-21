// ============================================================================
// Edge Function : ai-recommendation (AI Fitness Coach)
// Architecture sécurisée : App -> Edge Function -> AI provider -> réponse validée.
//
// Sécurité & coûts :
//  - Clé Anthropic UNIQUEMENT en secret serveur (ANTHROPIC_API_KEY). Jamais côté client.
//  - Utilisateur identifié par SON JWT.
//  - Les performances sont LUES EN BASE (source de vérité), pas envoyées par le client
//    -> anti-triche / anti-injection.
//  - Quota Free/Premium (table ai_usage_quota) + logging (ai_recommendations).
//  - Modèle configurable (AI_MODEL) ; défaut économique pour le cas simple.
//  - Sortie forcée en JSON, validée ; fallback déterministe si invalide.
//
// Sécurité produit : l'IA n'est pas un médecin. Détection de douleur -> message
// de prudence. Disclaimer inclus dans chaque réponse.
//
// Déploiement : supabase functions deploy ai-recommendation
// Secret requis : supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
// ============================================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const AI_MODEL = Deno.env.get('AI_MODEL') ?? 'claude-haiku-4-5';
const FREE_WEEKLY_LIMIT = Number(Deno.env.get('AI_FREE_WEEKLY_LIMIT') ?? '3');
const PREMIUM_WEEKLY_LIMIT = Number(Deno.env.get('AI_PREMIUM_WEEKLY_LIMIT') ?? '100');

interface Recommendation {
  suggested_weight_kg: number;
  suggested_sets: number;
  suggested_reps_min: number;
  suggested_reps_max: number;
  rest_seconds: number;
  rationale: string;
  disclaimer: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'unauthorized' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!anthropicKey) return json({ error: 'ai_not_configured' }, 503);

  // 1) Auth
  const userClient = createClient(supabaseUrl, serviceKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json({ error: 'unauthorized' }, 401);
  const userId = userData.user.id;

  const body = await req.json().catch(() => ({}));
  const exerciseId: string | undefined = body?.exerciseId;
  const note: string = typeof body?.note === 'string' ? body.note.slice(0, 500) : '';
  if (!exerciseId) return json({ error: 'missing_exercise' }, 400);

  const admin = createClient(supabaseUrl, serviceKey);

  // 2) Garde-fou sécurité produit : douleur / blessure -> conseil de prudence
  if (/(douleur|blessu|mal au|pain|injur|hurt)/i.test(note)) {
    return json({
      recommendation: null,
      safety_notice:
        "Tu mentionnes une douleur ou une gêne. Cette application ne remplace pas un professionnel de santé : consulte un médecin ou un kinésithérapeute avant de poursuivre.",
    }, 200);
  }

  // 3) Quota (tier depuis subscriptions)
  const { data: sub } = await admin.from('subscriptions').select('status').eq('user_id', userId).maybeSingle();
  const isPremium = sub?.status === 'active' || sub?.status === 'trial' || sub?.status === 'grace';
  const limit = isPremium ? PREMIUM_WEEKLY_LIMIT : FREE_WEEKLY_LIMIT;
  const periodStart = mondayOf(new Date()).toISOString().slice(0, 10);

  const { data: quota } = await admin.from('ai_usage_quota')
    .select('calls_used').eq('user_id', userId).eq('period_start', periodStart).maybeSingle();
  const used = quota?.calls_used ?? 0;
  if (used >= limit) {
    return json({ error: 'quota_exceeded', limit, tier: isPremium ? 'premium' : 'free' }, 429);
  }

  // 4) Données réelles (source de vérité) : dernières séries de l'utilisateur pour cet exercice
  const { data: recentSets } = await admin
    .from('sets')
    .select('weight_kg,reps,is_warmup,logged_at,workout_exercises!inner(exercise_id,workouts!inner(user_id))')
    .eq('workout_exercises.exercise_id', exerciseId)
    .eq('workout_exercises.workouts.user_id', userId)
    .order('logged_at', { ascending: false })
    .limit(15);

  const workSets = (recentSets ?? [])
    .filter((s: Record<string, unknown>) => !s.is_warmup)
    .map((s: Record<string, unknown>) => ({ weightKg: Number(s.weight_kg), reps: Number(s.reps) }));

  const { data: ex } = await admin.from('exercises').select('name').eq('id', exerciseId).maybeSingle();
  const exerciseName = ex?.name ?? 'exercice';

  // 5) Fallback déterministe (utilisé si l'IA échoue ou renvoie un JSON invalide)
  const fallback = deterministicSuggestion(workSets);

  // 6) Appel IA
  let recommendation: Recommendation = fallback;
  let model = AI_MODEL, tokens = 0;
  try {
    const aiRes = await callAnthropic(anthropicKey, AI_MODEL, exerciseName, workSets);
    if (aiRes.parsed) recommendation = { ...fallback, ...aiRes.parsed, disclaimer: DISCLAIMER };
    tokens = aiRes.tokens;
    model = aiRes.model;
  } catch (_e) {
    // On garde le fallback déterministe : jamais d'échec dur pour l'utilisateur.
    recommendation.disclaimer = DISCLAIMER;
  }

  // 7) Quota + log
  await admin.from('ai_usage_quota').upsert(
    { user_id: userId, period_start: periodStart, calls_used: used + 1, tier: isPremium ? 'premium' : 'free' },
    { onConflict: 'user_id,period_start' },
  );
  await admin.from('ai_recommendations').insert({
    user_id: userId, type: 'next_session', input_hash: exerciseId,
    request: { exerciseId, sets: workSets.length }, response: recommendation, model, tokens,
  });

  return json({ recommendation }, 200);
});

const DISCLAIMER =
  "Recommandation basée sur tes données d'entraînement. Ne remplace pas l'avis d'un professionnel de santé.";

async function callAnthropic(apiKey: string, model: string, exerciseName: string, sets: { weightKg: number; reps: number }[]) {
  const system =
    "Tu es un coach de force et d'hypertrophie. Tu ne donnes JAMAIS de conseil médical et ne diagnostiques pas. " +
    "Base-toi UNIQUEMENT sur les données fournies ; n'invente aucune performance. " +
    "Réponds STRICTEMENT en JSON valide correspondant au schéma, sans texte autour : " +
    '{"suggested_weight_kg":number,"suggested_sets":number,"suggested_reps_min":number,"suggested_reps_max":number,"rest_seconds":number,"rationale":string}';
  const history = sets.length
    ? sets.map((s) => `${s.weightKg}kg x ${s.reps}`).join(', ')
    : 'aucun historique';
  const user =
    `Exercice: ${exerciseName}. Dernières séries de travail (plus récentes d'abord): ${history}. ` +
    `Propose la prochaine séance (charge, séries, fourchette de reps, repos) avec une progression prudente. rationale en une phrase, en français.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 512,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });
  if (!res.ok) throw new Error(`anthropic_${res.status}`);
  const data = await res.json();
  const text = (data.content ?? []).filter((b: { type: string }) => b.type === 'text').map((b: { text: string }) => b.text).join('');
  const tokens = (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0);
  const parsed = safeParse(text);
  return { parsed, tokens, model: data.model ?? model };
}

function safeParse(text: string): Partial<Recommendation> | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const o = JSON.parse(match[0]);
    if (typeof o.suggested_weight_kg !== 'number') return null;
    return o;
  } catch {
    return null;
  }
}

function deterministicSuggestion(sets: { weightKg: number; reps: number }[]): Recommendation {
  const top = sets.length ? Math.max(...sets.map((s) => s.weightKg)) : 0;
  const allHit8 = sets.length > 0 && sets.every((s) => s.reps >= 8);
  const weight = sets.length ? (allHit8 ? round2(top + 2.5) : top) : 0;
  return {
    suggested_weight_kg: weight,
    suggested_sets: 3,
    suggested_reps_min: 6,
    suggested_reps_max: 8,
    rest_seconds: 120,
    rationale: sets.length
      ? (allHit8 ? 'Tu as atteint le haut de la fourchette : légère augmentation de charge.' : 'Consolide cette charge avant de progresser.')
      : 'Commence léger pour maîtriser le mouvement.',
    disclaimer: DISCLAIMER,
  };
}

function mondayOf(d: Date): Date {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = (date.getUTCDay() + 6) % 7; // 0 = Monday
  date.setUTCDate(date.getUTCDate() - day);
  return date;
}
function round2(n: number): number { return Math.round(n * 100) / 100; }
function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
