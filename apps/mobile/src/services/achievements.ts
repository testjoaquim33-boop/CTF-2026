import { supabase } from './supabase';
import {
  evaluateAchievements,
  type AchievementCriteria,
  type AchievementDef,
  type AchievementMetric,
  type AchievementStats,
} from '@project_fit/shared';

export interface AchievementView {
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  criteria: AchievementCriteria;
  unlocked: boolean;
  unlockedAt: string | null;
  progress: number; // 0..1 vers le seuil (pour l'UI)
}

export interface AchievementsResult {
  items: AchievementView[];
  newlyUnlocked: AchievementView[];
  stats: AchievementStats;
}

const ZERO_STATS: AchievementStats = {
  total_workouts: 0, streak_days: 0, level: 1, total_prs: 0,
  total_working_sets: 0, total_volume_kg: 0, ranked_exercises: 0,
};

/** Agrégats calculés CÔTÉ SERVEUR (RPC) — jamais fournis par le client. */
async function fetchStats(): Promise<AchievementStats> {
  const { data, error } = await supabase.rpc('get_achievement_stats');
  if (error) throw error;
  const row = (Array.isArray(data) ? data[0] : data) as Partial<Record<AchievementMetric, number>> | null;
  if (!row) return { ...ZERO_STATS };
  return {
    total_workouts: Number(row.total_workouts ?? 0),
    streak_days: Number(row.streak_days ?? 0),
    level: Number(row.level ?? 1),
    total_prs: Number(row.total_prs ?? 0),
    total_working_sets: Number(row.total_working_sets ?? 0),
    total_volume_kg: Number(row.total_volume_kg ?? 0),
    ranked_exercises: Number(row.ranked_exercises ?? 0),
  };
}

interface DefRow extends AchievementDef { id: string }

async function fetchDefs(): Promise<DefRow[]> {
  const { data, error } = await supabase
    .from('achievements')
    .select('id,slug,name,description,icon,criteria');
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id as string,
    slug: r.slug as string,
    name: r.name as string,
    description: (r.description as string) ?? null,
    icon: (r.icon as string) ?? null,
    criteria: (r.criteria ?? {}) as AchievementCriteria,
  }));
}

function progressFor(criteria: AchievementCriteria, stats: AchievementStats): number {
  const value = stats[criteria.metric];
  if (typeof value !== 'number' || !(criteria.gte > 0)) return 0;
  return Math.max(0, Math.min(1, value / criteria.gte));
}

/**
 * Récupère les badges, évalue ceux débloqués à partir des agrégats serveur,
 * PERSISTE les nouveaux débloqués (idempotent via PK user_id+achievement_id),
 * et renvoie la liste complète pour l'affichage.
 *
 * La persistance passe par la table `user_achievements` (RLS owner-only :
 * `with check (user_id = auth.uid())`), donc un utilisateur ne peut débloquer
 * que SES propres badges.
 */
export async function fetchAchievements(): Promise<AchievementsResult> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return { items: [], newlyUnlocked: [], stats: { ...ZERO_STATS } };

  const [stats, defs, ownedRes] = await Promise.all([
    fetchStats(),
    fetchDefs(),
    supabase.from('user_achievements').select('achievement_id,unlocked_at'),
  ]);

  const unlockedAtById = new Map<string, string>(
    (ownedRes.data ?? []).map((r) => [r.achievement_id as string, r.unlocked_at as string]),
  );

  const satisfiedSlugs = new Set(evaluateAchievements(stats, defs));

  // Nouveaux débloqués = satisfaits ET pas encore en base.
  const toInsert: { user_id: string; achievement_id: string }[] = [];
  const newlyUnlockedSlugs = new Set<string>();
  for (const d of defs) {
    if (satisfiedSlugs.has(d.slug) && !unlockedAtById.has(d.id)) {
      toInsert.push({ user_id: userId, achievement_id: d.id });
      newlyUnlockedSlugs.add(d.slug);
    }
  }
  if (toInsert.length > 0) {
    // upsert idempotent : si deux appels concourent, la PK évite les doublons.
    await supabase.from('user_achievements').upsert(toInsert, { onConflict: 'user_id,achievement_id', ignoreDuplicates: true });
  }

  const items: AchievementView[] = defs
    .map((d) => {
      const unlockedAt = unlockedAtById.get(d.id) ?? null;
      const unlocked = satisfiedSlugs.has(d.slug);
      return {
        slug: d.slug,
        name: d.name,
        description: d.description ?? null,
        icon: d.icon ?? null,
        criteria: d.criteria,
        unlocked,
        unlockedAt: unlocked ? (unlockedAt ?? new Date().toISOString()) : null,
        progress: unlocked ? 1 : progressFor(d.criteria, stats),
      };
    })
    // Débloqués d'abord, puis les plus proches du déblocage.
    .sort((a, b) => (Number(b.unlocked) - Number(a.unlocked)) || (b.progress - a.progress));

  const newlyUnlocked = items.filter((i) => newlyUnlockedSlugs.has(i.slug));
  return { items, newlyUnlocked, stats };
}
