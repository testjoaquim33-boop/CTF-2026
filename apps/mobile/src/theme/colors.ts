/**
 * Design System — Palette. Dark-first (thème sombre soigné), Light prévu.
 * Palette minimale (pas 15 couleurs) : 1 primaire sportive + neutres + sémantiques.
 * Les composants ne référencent JAMAIS un hex en dur : ils lisent ces tokens.
 */
export interface RankColors {
  bronze: string; silver: string; gold: string;
  platinum: string; diamond: string; elite: string;
}

export interface ColorScheme {
  primary: string;
  primaryMuted: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  rank: RankColors;
  bg: string;
  bgElevated: string;
  bgInput: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  onPrimary: string;
}

const rankColors: RankColors = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFC94D',
  platinum: '#7FE0D6',
  diamond: '#6EC1FF',
  elite: '#B57BFF',
};

export const darkColors: ColorScheme = {
  primary: '#FF4D2E',
  primaryMuted: '#FF7A63',
  success: '#3ED598',
  warning: '#FFB020',
  danger: '#FF4D4F',
  info: '#4D9BFF',
  rank: rankColors,
  bg: '#0B0B0F',
  bgElevated: '#15151C',
  bgInput: '#1E1E27',
  border: '#26262F',
  text: '#F5F5F7',
  textSecondary: '#A0A0AB',
  textMuted: '#6C6C78',
  onPrimary: '#FFFFFF',
};

export const lightColors: ColorScheme = {
  primary: '#FF4D2E',
  primaryMuted: '#FF7A63',
  success: '#3ED598',
  warning: '#FFB020',
  danger: '#FF4D4F',
  info: '#4D9BFF',
  rank: rankColors,
  bg: '#FFFFFF',
  bgElevated: '#F5F5F7',
  bgInput: '#EFEFF2',
  border: '#E2E2E8',
  text: '#0B0B0F',
  textSecondary: '#55555F',
  textMuted: '#8A8A94',
  onPrimary: '#FFFFFF',
};
