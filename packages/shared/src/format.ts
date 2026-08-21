import type { UnitSystem } from './types';

const KG_TO_LB = 2.2046226218;

export function kgToLb(kg: number): number {
  return kg * KG_TO_LB;
}
export function lbToKg(lb: number): number {
  return lb / KG_TO_LB;
}

/** Formate un poids stocké en kg selon le système d'unités de l'utilisateur. */
export function formatWeight(kg: number, unit: UnitSystem, digits = 1): string {
  if (unit === 'imperial') {
    return `${kgToLb(kg).toFixed(digits)} lb`;
  }
  return `${kg.toFixed(digits)} kg`;
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
