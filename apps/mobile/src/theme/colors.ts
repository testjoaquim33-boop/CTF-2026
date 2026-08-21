/**
 * Design System — Palette. Dark-first, mais plus vivante (accents forts, couleurs
 * par groupe musculaire, dégradés simulés). Aucun hex en dur dans les composants.
 */
export interface RankColors {
  bronze: string; silver: string; gold: string;
  platinum: string; diamond: string; elite: string;
}
export interface MuscleColors {
  push: string; pull: string; legs: string; core: string; posterior: string; arms: string;
}

export interface ColorScheme {
  primary: string;
  primaryMuted: string;
  primaryDark: string;
  secondary: string;      // accent secondaire (dégradés, variété)
  secondaryDark: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  rank: RankColors;
  muscle: MuscleColors;
  bg: string;
  bgElevated: string;
  bgCard: string;
  bgInput: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  onPrimary: string;
}

const rankColors: RankColors = {
  bronze: '#CD7F32', silver: '#C0C0C0', gold: '#FFC94D',
  platinum: '#7FE0D6', diamond: '#6EC1FF', elite: '#B57BFF',
};
const muscleColors: MuscleColors = {
  push: '#FF6B4D',      // chaud (poussée)
  pull: '#4D9BFF',      // bleu (tirage)
  legs: '#B57BFF',      // violet (jambes)
  core: '#3ED598',      // vert (core)
  posterior: '#FFB020', // ambre (chaîne post.)
  arms: '#FF5C8A',      // rose (bras)
};

export const darkColors: ColorScheme = {
  primary: '#FF5A36',
  primaryMuted: '#FF8A6B',
  primaryDark: '#C23A1E',
  secondary: '#7C5CFF',
  secondaryDark: '#5B3FD6',
  success: '#3ED598',
  warning: '#FFB020',
  danger: '#FF4D4F',
  info: '#4D9BFF',
  rank: rankColors,
  muscle: muscleColors,
  bg: '#0C0C12',
  bgElevated: '#17171F',
  bgCard: '#1C1C26',
  bgInput: '#22222E',
  border: '#2C2C3A',
  text: '#F7F7FA',
  textSecondary: '#ADADBB',
  textMuted: '#6E6E7E',
  onPrimary: '#FFFFFF',
};

export const lightColors: ColorScheme = {
  primary: '#FF5A36',
  primaryMuted: '#FF8A6B',
  primaryDark: '#C23A1E',
  secondary: '#7C5CFF',
  secondaryDark: '#5B3FD6',
  success: '#22B37A',
  warning: '#E6941A',
  danger: '#E23B3D',
  info: '#2E7DE0',
  rank: rankColors,
  muscle: muscleColors,
  bg: '#F6F6F9',
  bgElevated: '#FFFFFF',
  bgCard: '#FFFFFF',
  bgInput: '#EDEDF2',
  border: '#E2E2EA',
  text: '#12121A',
  textSecondary: '#55555F',
  textMuted: '#8A8A94',
  onPrimary: '#FFFFFF',
};
