/**
 * Libellés d'onboarding (FR). Structurés par option pour une i18n ultérieure.
 * L'UI lit ces maps ; la logique/validation reste dans @project_fit/shared.
 */
import type {
  GoalType, Level,
} from '@project_fit/shared';
import type { ExperienceBand, LocationType, EquipmentId } from '@project_fit/shared';

export const OBJECTIVE_LABELS: Record<GoalType, { title: string; desc?: string }> = {
  weight_loss: { title: 'Perdre du poids' },
  muscle: { title: 'Prendre du muscle' },
  strength: { title: 'Devenir plus fort' },
  recomp: { title: 'Recomposition corporelle', desc: 'Perdre du gras et gagner du muscle' },
  endurance: { title: 'Améliorer son endurance' },
  fitness: { title: 'Se remettre en forme' },
};

export const LEVEL_LABELS: Record<Level, { title: string; desc?: string }> = {
  beginner: { title: 'Débutant' },
  intermediate: { title: 'Intermédiaire' },
  advanced: { title: 'Avancé' },
};

export const EXPERIENCE_LABELS: Record<ExperienceBand, { title: string }> = {
  lt_3m: { title: 'Moins de 3 mois' },
  '3_12m': { title: '3 à 12 mois' },
  '1_3y': { title: '1 à 3 ans' },
  '3y_plus': { title: '3 ans et plus' },
};

export const LOCATION_LABELS: Record<LocationType, { title: string }> = {
  gym: { title: 'Salle de sport' },
  home: { title: 'Maison' },
  outdoor: { title: 'Extérieur' },
  mixed: { title: 'Mixte' },
};

export const EQUIPMENT_LABELS: Record<EquipmentId, { title: string }> = {
  none: { title: 'Aucun' },
  dumbbell: { title: 'Haltères' },
  barbell: { title: 'Barre' },
  bench: { title: 'Banc' },
  machine: { title: 'Machines' },
  full_gym: { title: 'Salle complète' },
};

export const SESSION_LABELS: Record<number, string> = {
  1: '1 séance', 2: '2 séances', 3: '3 séances',
  4: '4 séances', 5: '5 séances', 6: '6 et +',
};

export const DURATION_LABELS: Record<number, string> = {
  20: '20 min', 30: '30 min', 45: '45 min', 60: '60 min', 90: '90 min et +',
};
