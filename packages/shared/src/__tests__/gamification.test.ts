import { test } from 'node:test';
import assert from 'node:assert/strict';
import { levelForXp, xpForWorkout, computeStreak, type LevelRow } from '../gamification.ts';

const LEVELS: LevelRow[] = [
  { level: 1, minXp: 0, title: 'Beginner' },
  { level: 3, minXp: 250, title: 'Beginner' },
  { level: 10, minXp: 2000, title: 'Intermediate' },
  { level: 25, minXp: 12000, title: 'Advanced' },
];

test('levelForXp picks highest reached milestone', () => {
  assert.equal(levelForXp(0, LEVELS).level, 1);
  assert.equal(levelForXp(300, LEVELS).level, 3);
  assert.equal(levelForXp(2000, LEVELS).level, 10);
  assert.equal(levelForXp(999999, LEVELS).level, 25);
});

test('levelForXp progress toward next', () => {
  const s = levelForXp(1125, LEVELS); // between 250 and 2000
  assert.equal(s.level, 3);
  assert.ok(Math.abs(s.progress - (1125 - 250) / (2000 - 250)) < 1e-9);
  assert.equal(levelForXp(99999, LEVELS).nextMinXp, null);
  assert.equal(levelForXp(99999, LEVELS).progress, 1);
});

test('xpForWorkout', () => {
  assert.equal(xpForWorkout({ workingSets: 10, newPRs: 0 }), 100);
  assert.equal(xpForWorkout({ workingSets: 10, newPRs: 2 }), 180);
});

test('computeStreak', () => {
  assert.equal(computeStreak(null, '2026-01-10', 0), 1);
  assert.equal(computeStreak('2026-01-09', '2026-01-10', 4), 5);   // consecutive
  assert.equal(computeStreak('2026-01-10', '2026-01-10', 4), 4);   // same day
  assert.equal(computeStreak('2026-01-05', '2026-01-10', 4), 1);   // gap -> reset
});
