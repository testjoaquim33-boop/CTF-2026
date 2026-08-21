import type { WorkoutSet } from './types';

export interface ProgressionSuggestion {
  suggestedWeightKg: number;
  suggestedRepsMin: number;
  suggestedRepsMax: number;
  reason: 'progress' | 'hold' | 'deload';
}

/**
 * Progression de charge déterministe (double progression simplifiée).
 * Base : si l'utilisateur atteint le haut de la fourchette de reps sur toutes
 * les séries de travail -> augmenter la charge ; s'il est sous le bas -> deload ;
 * sinon -> maintenir. L'IA peut affiner ce résultat mais ne l'invente pas.
 *
 * increment : pas de charge (kg). Défaut 2.5 kg (config possible par exercice).
 */
export function suggestNextLoad(
  workingSets: WorkoutSet[],
  repsMin: number,
  repsMax: number,
  incrementKg = 2.5,
): ProgressionSuggestion {
  const sets = workingSets.filter((s) => !s.isWarmup && s.completed !== false);
  if (sets.length === 0) {
    return { suggestedWeightKg: 0, suggestedRepsMin: repsMin, suggestedRepsMax: repsMax, reason: 'hold' };
  }
  const topWeight = Math.max(...sets.map((s) => s.weightKg));
  const allHitTop = sets.every((s) => s.reps >= repsMax);
  const anyBelowMin = sets.some((s) => s.reps < repsMin);

  if (allHitTop) {
    return {
      suggestedWeightKg: round2(topWeight + incrementKg),
      suggestedRepsMin: repsMin,
      suggestedRepsMax: repsMax,
      reason: 'progress',
    };
  }
  if (anyBelowMin) {
    return {
      suggestedWeightKg: round2(Math.max(0, topWeight - incrementKg * 2)),
      suggestedRepsMin: repsMin,
      suggestedRepsMax: repsMax,
      reason: 'deload',
    };
  }
  return { suggestedWeightKg: round2(topWeight), suggestedRepsMin: repsMin, suggestedRepsMax: repsMax, reason: 'hold' };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
