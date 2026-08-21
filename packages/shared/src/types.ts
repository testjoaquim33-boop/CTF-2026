// Types de domaine partagés (purs, sans dépendance framework).
// Ces types miroir du schéma DB seront à terme générés depuis Supabase.

export type UUID = string;

export type Sex = 'male' | 'female' | 'unspecified';
export type UnitSystem = 'metric' | 'imperial';
export type Level = 'beginner' | 'intermediate' | 'advanced';

export type GoalType =
  | 'weight_loss'
  | 'muscle'
  | 'strength'
  | 'recomp'
  | 'endurance'
  | 'fitness';

export type WorkoutStatus =
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'discarded';

export type PersonalRecordType =
  | 'est_1rm'
  | 'max_weight'
  | 'max_reps'
  | 'max_volume';

export interface WorkoutSet {
  weightKg: number;
  reps: number;
  rpe?: number;
  isWarmup?: boolean;
  completed?: boolean;
}
