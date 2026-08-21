import type { WorkoutSet } from './types';

/**
 * Estimation du 1RM (one-rep max) via la formule d'Epley.
 * e1RM = weight * (1 + reps / 30). Pour reps === 1, retourne le poids brut.
 * Retourne 0 pour des entrées invalides (poids/reps <= 0).
 */
export function estimateOneRepMax(weightKg: number, reps: number): number {
  if (weightKg <= 0 || reps <= 0) return 0;
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

/** Volume d'une série = poids * répétitions. */
export function setVolume(set: WorkoutSet): number {
  if (set.weightKg <= 0 || set.reps <= 0) return 0;
  return set.weightKg * set.reps;
}

/** Volume total d'une liste de séries (échauffement inclus optionnellement). */
export function totalVolume(sets: WorkoutSet[], includeWarmup = false): number {
  return sets
    .filter((s) => includeWarmup || !s.isWarmup)
    .reduce((sum, s) => sum + setVolume(s), 0);
}

/** Meilleur e1RM parmi une liste de séries (série de travail). */
export function bestEstimatedOneRepMax(sets: WorkoutSet[]): number {
  return sets.reduce((best, s) => {
    if (s.isWarmup) return best;
    return Math.max(best, estimateOneRepMax(s.weightKg, s.reps));
  }, 0);
}

/**
 * Force relative = charge soulevée / poids de corps.
 * Pour les exercices au poids du corps avec charge additionnelle, passer
 * liftWeightKg = bodyweightKg + addedLoadKg (règle configurée côté backend).
 * Retourne 0 si bodyweightKg <= 0.
 */
export function relativeStrength(liftWeightKg: number, bodyweightKg: number): number {
  if (bodyweightKg <= 0) return 0;
  return liftWeightKg / bodyweightKg;
}
