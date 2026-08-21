/**
 * Calcul de rang & garde-fous anti-triche.
 * Les seuils viennent de la base (`rank_thresholds`) : rien n'est codé en dur.
 */
export interface RankThreshold {
  rankSlug: string;
  minValue: number;
  maxValue: number | null;
}

/**
 * Détermine le rang pour un score donné (ex. force relative = charge / poids de corps).
 * Retourne le slug du rang dont [minValue, maxValue) contient le score, sinon null.
 * `thresholds` peut être dans n'importe quel ordre.
 */
export function computeRank(score: number, thresholds: RankThreshold[]): string | null {
  for (const t of thresholds) {
    const upper = t.maxValue ?? Infinity;
    if (score >= t.minValue && score < upper) return t.rankSlug;
  }
  return null;
}

/**
 * Anti-triche : bornes de plausibilité d'une performance.
 * Retourne un code d'erreur si la valeur est implausible, sinon null.
 * Ces bornes sont volontairement larges (rejet des valeurs absurdes uniquement) ;
 * un affinage statistique côté serveur viendra plus tard.
 */
export function validatePerformance(params: {
  weightKg: number; reps: number; bodyweightKg: number;
}): string | null {
  const { weightKg, reps, bodyweightKg } = params;
  if (!(weightKg > 0) || weightKg > 600) return 'implausible_weight';       // record du monde ~ 500 kg
  if (!(reps > 0) || reps > 100) return 'implausible_reps';
  if (!(bodyweightKg >= 30) || bodyweightKg > 400) return 'implausible_bodyweight';
  // Force relative absurde : > 6x le poids du corps sur une charge externe = suspect.
  if (weightKg / bodyweightKg > 6) return 'implausible_relative_strength';
  return null;
}
