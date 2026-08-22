// ============================================================================
// Achievements (badges) — logique pure, testable, sans dépendance réseau.
//
// Le catalogue des badges vit EN BASE (table `achievements`, colonne `criteria`
// en JSONB) pour rester configurable sans redéploiement de l'app. Ici on ne
// définit que :
//   - la forme d'un critère (`AchievementCriteria`)
//   - les agrégats de l'utilisateur (`AchievementStats`)
//   - l'évaluation déterministe « ce critère est-il rempli ? »
//
// Anti-triche : les agrégats sont TOUJOURS calculés côté serveur/DB à partir de
// la source de vérité (séances, séries, records…), jamais fournis par le client.
// ============================================================================

/** Métriques sur lesquelles un badge peut porter (miroir des agrégats DB). */
export type AchievementMetric =
  | 'total_workouts'      // séances terminées
  | 'streak_days'         // jours consécutifs
  | 'level'               // niveau atteint
  | 'total_prs'           // records personnels battus
  | 'total_working_sets'  // séries de travail (hors échauffement)
  | 'total_volume_kg'     // volume cumulé (Σ charge × reps)
  | 'ranked_exercises';   // exercices publiés au classement

/**
 * Critère d'un badge, tel que stocké dans `achievements.criteria` (JSONB).
 * Sémantique volontairement minimale et sûre : « metric >= gte ».
 */
export interface AchievementCriteria {
  metric: AchievementMetric;
  gte: number;
}

/** Agrégats de l'utilisateur (calculés côté serveur, source de vérité). */
export interface AchievementStats {
  total_workouts: number;
  streak_days: number;
  level: number;
  total_prs: number;
  total_working_sets: number;
  total_volume_kg: number;
  ranked_exercises: number;
}

/** Définition d'un badge (miroir d'une ligne `achievements`). */
export interface AchievementDef {
  slug: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  criteria: AchievementCriteria;
}

/** Un critère est-il inconnu / mal formé ? (fail-closed : jamais débloqué) */
function isValidCriteria(c: unknown): c is AchievementCriteria {
  if (!c || typeof c !== 'object') return false;
  const { metric, gte } = c as Record<string, unknown>;
  return typeof metric === 'string' && typeof gte === 'number' && Number.isFinite(gte);
}

const KNOWN_METRICS: ReadonlySet<string> = new Set<AchievementMetric>([
  'total_workouts', 'streak_days', 'level', 'total_prs',
  'total_working_sets', 'total_volume_kg', 'ranked_exercises',
]);

/**
 * Ce critère est-il rempli par ces agrégats ?
 * Fail-closed : critère absent, mal formé, ou métrique inconnue -> false.
 */
export function isAchievementUnlocked(criteria: unknown, stats: AchievementStats): boolean {
  if (!isValidCriteria(criteria)) return false;
  if (!KNOWN_METRICS.has(criteria.metric)) return false;
  const value = stats[criteria.metric];
  if (typeof value !== 'number' || !Number.isFinite(value)) return false;
  return value >= criteria.gte;
}

/**
 * Renvoie les `slug` des badges débloqués pour ces agrégats.
 * Déterministe et sans effet de bord — la persistance des nouveaux débloqués
 * est faite ailleurs (service).
 */
export function evaluateAchievements(stats: AchievementStats, defs: AchievementDef[]): string[] {
  return defs.filter((d) => isAchievementUnlocked(d.criteria, stats)).map((d) => d.slug);
}
