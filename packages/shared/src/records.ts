import type { WorkoutSet, PersonalRecordType } from './types';
import { estimateOneRepMax, setVolume } from './strength';

export interface PRValue {
  type: PersonalRecordType;
  value: number;
  unit: string;
}

/** Meilleurs records atteignables à partir d'une liste de séries de travail. */
export function computeSessionBests(sets: WorkoutSet[]): PRValue[] {
  const work = sets.filter((s) => !s.isWarmup && s.completed !== false && s.reps > 0);
  if (work.length === 0) return [];

  const maxWeight = Math.max(...work.map((s) => s.weightKg));
  const maxReps = Math.max(...work.map((s) => s.reps));
  const maxVolume = Math.max(...work.map(setVolume));
  const bestE1rm = Math.max(...work.map((s) => estimateOneRepMax(s.weightKg, s.reps)));

  return [
    { type: 'max_weight', value: round2(maxWeight), unit: 'kg' },
    { type: 'max_reps', value: maxReps, unit: 'reps' },
    { type: 'max_volume', value: round2(maxVolume), unit: 'kg' },
    { type: 'est_1rm', value: round2(bestE1rm), unit: 'kg' },
  ];
}

/**
 * Détecte les nouveaux records vs. les meilleurs existants.
 * `previousBests` : valeur record actuelle par type (0 si aucun).
 * Retourne uniquement les types réellement dépassés (strictement supérieurs).
 */
export function detectNewPRs(
  sets: WorkoutSet[],
  previousBests: Partial<Record<PersonalRecordType, number>>,
): PRValue[] {
  return computeSessionBests(sets).filter(
    (pr) => pr.value > (previousBests[pr.type] ?? 0),
  );
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
