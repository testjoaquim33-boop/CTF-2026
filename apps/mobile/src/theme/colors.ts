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
  lime: string;           // teintes de gamification (stats, streak, badges)
  cyan: string;
  pink: string;
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
  primary: '#FF5A1F',       // orange feu
  primaryMuted: '#FF9166',
  primaryDark: '#C4360F',
  secondary: '#8B5CFF',     // violet
  secondaryDark: '#6A3EE0',
  success: '#33E0A3',
  warning: '#FFB020',
  danger: '#FF4D5E',
  info: '#25D8F0',
  lime: '#B6FF3B',
  cyan: '#25D8F0',
  pink: '#FF4D8D',
  rank: rankColors,
  muscle: muscleColors,
  bg: '#08070E',
  bgElevated: '#1C1830',
  bgCard: '#16131F',
  bgInput: '#221D33',
  border: '#2C2740',
  text: '#F6F4FF',
  textSecondary: '#A49FC0',
  textMuted: '#6E698C',
  onPrimary: '#FFFFFF',
};

export const lightColors: ColorScheme = {
  primary: '#F0480F',
  primaryMuted: '#FF8A5C',
  primaryDark: '#C4360F',
  secondary: '#7A45FF',
  secondaryDark: '#5B2FD6',
  success: '#12B583',
  warning: '#E6941A',
  danger: '#E23B4D',
  info: '#0FA6C0',
  lime: '#66C400',
  cyan: '#0FA6C0',
  pink: '#E23B7A',
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
