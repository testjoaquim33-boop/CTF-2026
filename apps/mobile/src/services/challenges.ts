import { supabase } from './supabase';
import {
  challengeProgress,
  isChallengeLive,
  daysRemaining,
  isValidChallengeConfig,
  type ChallengeConfig,
} from '@project_fit/shared';

export interface ChallengeView {
  id: string;
  slug: string;
  name: string;
  config: ChallengeConfig | null;
  isPremium: boolean;
  startsAt: string | null;
  endsAt: string | null;
  daysLeft: number | null;
  joined: boolean;
  completed: boolean;
  value: number;
  target: number;
  progress: number;   // 0..1
  remaining: number;
}

interface ChallengeRow {
  id: string; slug: string; name: string; type: string;
  config: unknown; is_premium: boolean;
  starts_at: string | null; ends_at: string | null; is_active: boolean;
}

/**
 * Récupère les challenges actifs, fusionne avec la progression calculée
 * CÔTÉ SERVEUR (RPC) et l'état de participation de l'utilisateur.
 * Marque automatiquement `completed_at` quand un défi rejoint est atteint.
 */
export async function fetchChallenges(): Promise<ChallengeView[]> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return [];

  const [chRes, progRes, partRes] = await Promise.all([
    supabase.from('challenges')
      .select('id,slug,name,type,config,is_premium,starts_at,ends_at,is_active')
      .eq('is_active', true),
    supabase.rpc('get_challenge_progress'),
    supabase.from('challenge_participants').select('challenge_id,completed_at'),
  ]);
  if (chRes.error) throw chRes.error;

  const valueById = new Map<string, number>(
    (Array.isArray(progRes.data) ? progRes.data : []).map(
      (r: { challenge_id: string; value: number | string }) => [r.challenge_id, Number(r.value)],
    ),
  );
  const partById = new Map<string, { completed_at: string | null }>(
    (partRes.data ?? []).map((r) => [r.challenge_id as string, { completed_at: (r.completed_at as string) ?? null }]),
  );

  const now = new Date();
  const toStampCompleted: string[] = [];

  const items = (chRes.data as ChallengeRow[] | null ?? [])
    .filter((c) => isChallengeLive(c.starts_at, c.ends_at, c.is_active, now))
    .map((c) => {
      const config = isValidChallengeConfig(c.config) ? c.config : null;
      const target = config?.target ?? 0;
      const value = valueById.get(c.id) ?? 0;
      const pr = challengeProgress(value, target);
      const part = partById.get(c.id);
      const joined = !!part;
      const completed = joined && (!!part?.completed_at || pr.completed);

      // Stamp completed_at une seule fois quand le défi rejoint est atteint.
      if (joined && pr.completed && !part?.completed_at) toStampCompleted.push(c.id);

      return {
        id: c.id, slug: c.slug, name: c.name,
        config, isPremium: c.is_premium,
        startsAt: c.starts_at, endsAt: c.ends_at,
        daysLeft: daysRemaining(c.ends_at, now),
        joined, completed,
        value: pr.value, target: pr.target, progress: pr.progress, remaining: pr.remaining,
      } as ChallengeView;
    })
    // Rejoints d'abord, puis les plus avancés.
    .sort((a, b) => (Number(b.joined) - Number(a.joined)) || (b.progress - a.progress));

  if (toStampCompleted.length > 0) {
    await supabase.from('challenge_participants')
      .update({ completed_at: new Date().toISOString() })
      .eq('user_id', userId)
      .in('challenge_id', toStampCompleted)
      .is('completed_at', null);
  }

  return items;
}

/** Rejoindre un défi (idempotent via PK challenge_id+user_id, RLS owner-only). */
export async function joinChallenge(challengeId: string): Promise<{ ok: boolean; error?: string }> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return { ok: false, error: 'not_authenticated' };
  const { error } = await supabase.from('challenge_participants')
    .upsert({ challenge_id: challengeId, user_id: userId }, { onConflict: 'challenge_id,user_id', ignoreDuplicates: true });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Quitter un défi. */
export async function leaveChallenge(challengeId: string): Promise<{ ok: boolean; error?: string }> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return { ok: false, error: 'not_authenticated' };
  const { error } = await supabase.from('challenge_participants')
    .delete().eq('challenge_id', challengeId).eq('user_id', userId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
