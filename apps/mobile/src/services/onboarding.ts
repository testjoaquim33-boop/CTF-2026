import { supabase } from './supabase';
import { toPersistPayload, type OnboardingDraft } from '@project_fit/shared';

export interface SaveResult { ok: boolean; error?: string }

/**
 * Persiste l'onboarding pour l'utilisateur courant :
 *  - met à jour le profil (taille, sexe, année de naissance),
 *  - enregistre un objectif actif,
 *  - enregistre le snapshot des réponses,
 *  - crée une 1re mesure de poids.
 * Écrit uniquement les données de l'utilisateur (RLS garantit l'isolation).
 */
export async function saveOnboarding(draft: OnboardingDraft): Promise<SaveResult> {
  const payload = toPersistPayload(draft);

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return { ok: false, error: 'not_authenticated' };

  const profileUpdate = await supabase
    .from('profiles')
    .update({
      height_cm: payload.profile.height_cm,
      sex: payload.profile.sex ?? 'unspecified',
      birth_year: payload.profile.birth_year ?? null,
    })
    .eq('id', userId);
  if (profileUpdate.error) return { ok: false, error: profileUpdate.error.message };

  // Désactive les objectifs précédents puis insère le nouvel objectif actif.
  await supabase.from('goals').update({ active: false }).eq('user_id', userId).eq('active', true);
  const goalInsert = await supabase.from('goals').insert({ user_id: userId, ...payload.goal });
  if (goalInsert.error) return { ok: false, error: goalInsert.error.message };

  const onboardingUpsert = await supabase
    .from('onboarding_answers')
    .upsert({ user_id: userId, ...payload.onboarding, completed_at: new Date().toISOString() });
  if (onboardingUpsert.error) return { ok: false, error: onboardingUpsert.error.message };

  const bodyInsert = await supabase
    .from('body_metrics')
    .upsert(
      { user_id: userId, date: new Date().toISOString().slice(0, 10), ...payload.bodyMetric },
      { onConflict: 'user_id,date' },
    );
  if (bodyInsert.error) return { ok: false, error: bodyInsert.error.message };

  return { ok: true };
}
