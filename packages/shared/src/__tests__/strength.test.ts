import { test } from 'node:test';
import assert from 'node:assert/strict';
import { estimateOneRepMax, totalVolume, bestEstimatedOneRepMax, relativeStrength } from '../strength.ts';
import { suggestNextLoad } from '../progression.ts';
import { formatWeight, kgToLb } from '../format.ts';

test('estimateOneRepMax: Epley formula', () => {
  assert.equal(estimateOneRepMax(100, 1), 100);
  assert.ok(Math.abs(estimateOneRepMax(100, 10) - 133.333) < 0.01);
  assert.equal(estimateOneRepMax(0, 5), 0);
  assert.equal(estimateOneRepMax(50, 0), 0);
});

test('totalVolume excludes warmups by default', () => {
  const sets = [
    { weightKg: 60, reps: 10, isWarmup: true },
    { weightKg: 80, reps: 8 },
    { weightKg: 80, reps: 8 },
  ];
  assert.equal(totalVolume(sets), 1280);
  assert.equal(totalVolume(sets, true), 1880);
});

test('bestEstimatedOneRepMax picks strongest working set', () => {
  const sets = [
    { weightKg: 60, reps: 10, isWarmup: true },
    { weightKg: 100, reps: 5 },
    { weightKg: 90, reps: 8 },
  ];
  const best = bestEstimatedOneRepMax(sets);
  assert.ok(best >= estimateOneRepMax(100, 5) - 0.001);
});

test('relativeStrength', () => {
  assert.equal(relativeStrength(120, 80), 1.5);
  assert.equal(relativeStrength(100, 0), 0);
});

test('suggestNextLoad: progress when hitting top of range', () => {
  const s = suggestNextLoad([{ weightKg: 80, reps: 8 }, { weightKg: 80, reps: 8 }], 6, 8, 2.5);
  assert.equal(s.reason, 'progress');
  assert.equal(s.suggestedWeightKg, 82.5);
});

test('suggestNextLoad: deload when below min', () => {
  const s = suggestNextLoad([{ weightKg: 80, reps: 4 }], 6, 8, 2.5);
  assert.equal(s.reason, 'deload');
  assert.equal(s.suggestedWeightKg, 75);
});

test('formatWeight imperial converts', () => {
  assert.equal(formatWeight(100, 'metric'), '100.0 kg');
  assert.equal(formatWeight(100, 'imperial'), `${kgToLb(100).toFixed(1)} lb`);
});
