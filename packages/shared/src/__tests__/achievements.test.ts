import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isAchievementUnlocked,
  evaluateAchievements,
  type AchievementDef,
  type AchievementStats,
} from '../achievements.ts';

const STATS: AchievementStats = {
  total_workouts: 12,
  streak_days: 7,
  level: 4,
  total_prs: 3,
  total_working_sets: 140,
  total_volume_kg: 25000,
  ranked_exercises: 2,
};

const DEFS: AchievementDef[] = [
  { slug: 'first_workout', name: 'Premier pas', criteria: { metric: 'total_workouts', gte: 1 } },
  { slug: 'ten_workouts', name: 'Assidu', criteria: { metric: 'total_workouts', gte: 10 } },
  { slug: 'fifty_workouts', name: 'Machine', criteria: { metric: 'total_workouts', gte: 50 } },
  { slug: 'streak_7', name: 'Semaine parfaite', criteria: { metric: 'streak_days', gte: 7 } },
  { slug: 'streak_30', name: 'Inarrêtable', criteria: { metric: 'streak_days', gte: 30 } },
  { slug: 'level_10', name: 'Confirmé', criteria: { metric: 'level', gte: 10 } },
  { slug: 'first_pr', name: 'Record !', criteria: { metric: 'total_prs', gte: 1 } },
  { slug: 'ranked', name: 'Dans l’arène', criteria: { metric: 'ranked_exercises', gte: 1 } },
];

test('isAchievementUnlocked: gte satisfied / not satisfied', () => {
  assert.equal(isAchievementUnlocked({ metric: 'total_workouts', gte: 12 }, STATS), true);
  assert.equal(isAchievementUnlocked({ metric: 'total_workouts', gte: 13 }, STATS), false);
  assert.equal(isAchievementUnlocked({ metric: 'streak_days', gte: 7 }, STATS), true);
});

test('isAchievementUnlocked: fail-closed on bad/unknown criteria', () => {
  assert.equal(isAchievementUnlocked(null, STATS), false);
  assert.equal(isAchievementUnlocked({}, STATS), false);
  assert.equal(isAchievementUnlocked({ metric: 'total_workouts' }, STATS), false); // no gte
  assert.equal(isAchievementUnlocked({ metric: 'unknown_metric', gte: 1 }, STATS), false);
  assert.equal(isAchievementUnlocked({ metric: 'total_workouts', gte: 'x' }, STATS), false);
});

test('evaluateAchievements returns only satisfied slugs', () => {
  const unlocked = evaluateAchievements(STATS, DEFS);
  assert.deepEqual(
    unlocked.sort(),
    ['first_pr', 'first_workout', 'ranked', 'streak_7', 'ten_workouts'].sort(),
  );
  // Not reached:
  assert.ok(!unlocked.includes('fifty_workouts'));
  assert.ok(!unlocked.includes('streak_30'));
  assert.ok(!unlocked.includes('level_10'));
});

test('evaluateAchievements on empty stats unlocks nothing (except gte<=0)', () => {
  const zero: AchievementStats = {
    total_workouts: 0, streak_days: 0, level: 1, total_prs: 0,
    total_working_sets: 0, total_volume_kg: 0, ranked_exercises: 0,
  };
  // level starts at 1, so a level>=1 badge would unlock; none here.
  const unlocked = evaluateAchievements(zero, DEFS);
  assert.deepEqual(unlocked, []);
});
