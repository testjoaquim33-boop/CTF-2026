import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeRank, validatePerformance, type RankThreshold } from '../ranking.ts';

const TH: RankThreshold[] = [
  { rankSlug: 'bronze', minValue: 0, maxValue: 0.75 },
  { rankSlug: 'silver', minValue: 0.75, maxValue: 1.0 },
  { rankSlug: 'gold', minValue: 1.0, maxValue: 1.25 },
  { rankSlug: 'elite', minValue: 1.75, maxValue: null },
];

test('computeRank maps score to band', () => {
  assert.equal(computeRank(0.5, TH), 'bronze');
  assert.equal(computeRank(0.9, TH), 'silver');
  assert.equal(computeRank(1.1, TH), 'gold');
  assert.equal(computeRank(2.0, TH), 'elite');    // open-ended top
  assert.equal(computeRank(1.4, TH), null);       // gap not covered
});

test('validatePerformance rejects absurd values', () => {
  assert.equal(validatePerformance({ weightKg: 100, reps: 5, bodyweightKg: 80 }), null);
  assert.equal(validatePerformance({ weightKg: 0, reps: 5, bodyweightKg: 80 }), 'implausible_weight');
  assert.equal(validatePerformance({ weightKg: 100, reps: 500, bodyweightKg: 80 }), 'implausible_reps');
  assert.equal(validatePerformance({ weightKg: 100, reps: 5, bodyweightKg: 10 }), 'implausible_bodyweight');
  assert.equal(validatePerformance({ weightKg: 700, reps: 1, bodyweightKg: 80 }), 'implausible_weight');
  assert.equal(validatePerformance({ weightKg: 560, reps: 1, bodyweightKg: 80 }), 'implausible_relative_strength');
});
