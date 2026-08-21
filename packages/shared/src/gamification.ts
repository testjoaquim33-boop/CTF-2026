/** Paliers de niveau (miroir de la table `levels`, seuils configurables en base). */
export interface LevelRow { level: number; minXp: number; title: string }

export interface LevelState {
  level: number;
  title: string;
  minXp: number;
  nextMinXp: number | null; // null = niveau max atteint
  progress: number;         // 0..1 vers le palier suivant
}

/**
 * Détermine le palier atteint pour un total d'XP donné.
 * `levels` peut être clairsemé (1,2,3,5,10,…) : on prend le plus haut palier
 * dont minXp <= xp, et on calcule la progression vers le palier suivant.
 */
export function levelForXp(xp: number, levels: LevelRow[]): LevelState {
  const sorted = [...levels].sort((a, b) => a.minXp - b.minXp);
  if (sorted.length === 0) return { level: 1, title: 'Beginner', minXp: 0, nextMinXp: null, progress: 0 };

  let current: LevelRow = sorted[0]!;
  let next: LevelRow | null = null;
  for (let i = 0; i < sorted.length; i++) {
    const row = sorted[i]!;
    if (xp >= row.minXp) {
      current = row;
      next = sorted[i + 1] ?? null;
    } else {
      break;
    }
  }
  const progress = next
    ? Math.max(0, Math.min(1, (xp - current.minXp) / (next.minXp - current.minXp)))
    : 1;
  return { level: current.level, title: current.title, minXp: current.minXp, nextMinXp: next?.minXp ?? null, progress };
}

/** XP gagné pour une séance terminée (base + bonus séries + bonus records). */
export function xpForWorkout(params: { workingSets: number; newPRs: number }): number {
  const base = 50;
  const perSet = 5;
  const perPR = 40;
  return base + params.workingSets * perSet + params.newPRs * perPR;
}

/** Met à jour un streak selon la date de dernière activité (chaînes de jours). */
export function computeStreak(lastActiveDate: string | null, today: string, currentStreak: number): number {
  if (!lastActiveDate) return 1;
  if (lastActiveDate === today) return currentStreak; // déjà compté aujourd'hui
  const diff = daysBetween(lastActiveDate, today);
  if (diff === 1) return currentStreak + 1;
  return 1; // rupture -> reset
}

function daysBetween(a: string, b: string): number {
  const da = Date.parse(a + 'T00:00:00Z');
  const db = Date.parse(b + 'T00:00:00Z');
  return Math.round((db - da) / 86400000);
}
