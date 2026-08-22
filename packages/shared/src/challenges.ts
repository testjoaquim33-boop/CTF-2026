// ============================================================================
// Challenges (défis à durée limitée) — logique pure, testable.
//
// Un défi porte sur une MÉTRIQUE cumulée dans une fenêtre de temps
// (ex : « 10 séances en 30 jours »). La progression est TOUJOURS calculée
// côté serveur à partir de la source de vérité (voir get_challenge_progress),
// jamais fournie par le client -> anti-triche.
//
// Le catalogue (table `challenges`) stocke type='metric_target' et
// config = { "metric": <metric>, "target": <n> }, configurable sans redéploiement.
// ============================================================================

/** Métriques cumulables sur une fenêtre de temps (comptages / sommes). */
export type ChallengeMetric =
  | 'workouts'      // séances terminées dans la fenêtre
  | 'working_sets'  // séries de travail (hors échauffement)
  | 'volume_kg'     // volume cumulé (Σ charge × reps)
  | 'prs';          // records personnels battus

export interface ChallengeConfig {
  metric: ChallengeMetric;
  target: number;
}

export const CHALLENGE_METRICS: ReadonlySet<string> = new Set<ChallengeMetric>([
  'workouts', 'working_sets', 'volume_kg', 'prs',
]);

/** Config valide ? (fail-closed : target > 0 et métrique connue) */
export function isValidChallengeConfig(c: unknown): c is ChallengeConfig {
  if (!c || typeof c !== 'object') return false;
  const { metric, target } = c as Record<string, unknown>;
  return typeof metric === 'string'
    && CHALLENGE_METRICS.has(metric)
    && typeof target === 'number'
    && Number.isFinite(target)
    && target > 0;
}

export interface ChallengeProgress {
  value: number;      // valeur atteinte (bornée >= 0)
  target: number;
  progress: number;   // 0..1
  remaining: number;  // reste à faire (>= 0)
  completed: boolean;
}

/**
 * Calcule la progression d'un défi à partir d'une valeur mesurée et d'une cible.
 * Déterministe et sans effet de bord.
 */
export function challengeProgress(value: number, target: number): ChallengeProgress {
  const safeTarget = target > 0 ? target : 0;
  const safeValue = Number.isFinite(value) && value > 0 ? value : 0;
  const progress = safeTarget > 0 ? Math.max(0, Math.min(1, safeValue / safeTarget)) : 0;
  return {
    value: safeValue,
    target: safeTarget,
    progress,
    remaining: Math.max(0, safeTarget - safeValue),
    completed: safeTarget > 0 && safeValue >= safeTarget,
  };
}

/** Un défi est-il actif à l'instant `now` (bornes optionnelles) ? */
export function isChallengeLive(
  starts: string | null,
  ends: string | null,
  isActive: boolean,
  now: Date = new Date(),
): boolean {
  if (!isActive) return false;
  const t = now.getTime();
  if (starts && Date.parse(starts) > t) return false; // pas encore commencé
  if (ends && Date.parse(ends) < t) return false;     // terminé
  return true;
}

/** Jours restants avant la fin (arrondi au supérieur), null si pas de fin. */
export function daysRemaining(ends: string | null, now: Date = new Date()): number | null {
  if (!ends) return null;
  const diffMs = Date.parse(ends) - now.getTime();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / 86400000);
}
