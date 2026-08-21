import type { GoalType, Level, Sex } from './types';

/**
 * Définition centralisée du parcours d'onboarding (source unique de vérité,
 * partagée entre l'UI mobile et la validation). Les libellés affichés sont
 * référencés par des clés i18n côté app ; ici on ne stocke que les identifiants
 * stables et les valeurs de domaine.
 */
export type ExperienceBand = 'lt_3m' | '3_12m' | '1_3y' | '3y_plus';
export type LocationType = 'gym' | 'home' | 'outdoor' | 'mixed';
export type EquipmentId =
  | 'none' | 'dumbbell' | 'barbell' | 'bench' | 'machine' | 'full_gym';

export const OBJECTIVES: GoalType[] = [
  'weight_loss', 'muscle', 'strength', 'recomp', 'endurance', 'fitness',
];
export const LEVELS: Level[] = ['beginner', 'intermediate', 'advanced'];
export const EXPERIENCE_BANDS: ExperienceBand[] = ['lt_3m', '3_12m', '1_3y', '3y_plus'];
export const SESSIONS_OPTIONS = [1, 2, 3, 4, 5, 6] as const;      // 6 = "6+"
export const DURATION_OPTIONS = [20, 30, 45, 60, 90] as const;    // minutes (90 = "90+")
export const LOCATIONS: LocationType[] = ['gym', 'home', 'outdoor', 'mixed'];
export const EQUIPMENT_OPTIONS: EquipmentId[] = [
  'none', 'dumbbell', 'barbell', 'bench', 'machine', 'full_gym',
];

/** Réponses collectées pendant l'onboarding (état progressif). */
export interface OnboardingDraft {
  objective?: GoalType;
  level?: Level;
  experience?: ExperienceBand;
  sessionsPerWeek?: number;
  durationMinutes?: number;
  location?: LocationType;
  equipment?: EquipmentId[];
  heightCm?: number;
  weightKg?: number;
  targetWeightKg?: number;
  sex?: Sex;
  birthYear?: number;
}

/** Étapes ordonnées (l'écran de bienvenue n'a pas de saisie -> non listé ici). */
export const ONBOARDING_STEPS = [
  'objective', 'level', 'experience', 'sessions',
  'duration', 'location', 'equipment', 'body',
] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

/** Valide une étape donnée. Retourne null si OK, sinon un code d'erreur i18n. */
export function validateStep(step: OnboardingStep, d: OnboardingDraft): string | null {
  switch (step) {
    case 'objective': return d.objective ? null : 'select_objective';
    case 'level': return d.level ? null : 'select_level';
    case 'experience': return d.experience ? null : 'select_experience';
    case 'sessions': return d.sessionsPerWeek ? null : 'select_sessions';
    case 'duration': return d.durationMinutes ? null : 'select_duration';
    case 'location': return d.location ? null : 'select_location';
    case 'equipment':
      return d.equipment && d.equipment.length > 0 ? null : 'select_equipment';
    case 'body':
      if (!d.heightCm || d.heightCm < 100 || d.heightCm > 250) return 'invalid_height';
      if (!d.weightKg || d.weightKg < 30 || d.weightKg > 400) return 'invalid_weight';
      if (d.targetWeightKg != null && (d.targetWeightKg < 30 || d.targetWeightKg > 400))
        return 'invalid_target_weight';
      if (d.birthYear != null) {
        const year = new Date().getUTCFullYear();
        if (d.birthYear < 1900 || d.birthYear > year - 10) return 'invalid_birth_year';
      }
      return null;
  }
}

/** Le brouillon est-il complet et valide pour tous les écrans ? */
export function isDraftComplete(d: OnboardingDraft): boolean {
  return ONBOARDING_STEPS.every((s) => validateStep(s, d) === null);
}

/** Formes prêtes à être persistées (profiles / goals / onboarding_answers). */
export interface OnboardingPersistPayload {
  profile: { height_cm: number; sex: Sex | undefined; birth_year: number | undefined };
  goal: {
    type: GoalType;
    target_weight_kg: number | undefined;
    sessions_per_week: number;
    session_minutes: number;
    location: LocationType;
    active: boolean;
  };
  onboarding: {
    objective: GoalType;
    level: Level;
    experience: ExperienceBand;
    sessions: number;
    duration: number;
    location: LocationType;
    equipment: EquipmentId[];
  };
  bodyMetric: { weight_kg: number };
}

/**
 * Transforme un brouillon complet en payloads DB. Lève si incomplet
 * (le garde-fou UI doit empêcher d'arriver ici sinon).
 */
export function toPersistPayload(d: OnboardingDraft): OnboardingPersistPayload {
  if (!isDraftComplete(d)) {
    throw new Error('onboarding_incomplete');
  }
  return {
    profile: { height_cm: d.heightCm!, sex: d.sex, birth_year: d.birthYear },
    goal: {
      type: d.objective!,
      target_weight_kg: d.targetWeightKg,
      sessions_per_week: d.sessionsPerWeek!,
      session_minutes: d.durationMinutes!,
      location: d.location!,
      active: true,
    },
    onboarding: {
      objective: d.objective!,
      level: d.level!,
      experience: d.experience!,
      sessions: d.sessionsPerWeek!,
      duration: d.durationMinutes!,
      location: d.location!,
      equipment: d.equipment!,
    },
    bodyMetric: { weight_kg: d.weightKg! },
  };
}
