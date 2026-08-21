import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeSessionBests, detectNewPRs } from '../records.ts';

const sets = [
  { weightKg: 60, reps: 10, isWarmup: true },
  { weightKg: 80, reps: 8 },
  { weightKg: 85, reps: 5 },
];

test('computeSessionBests ignores warmups', () => {
  const bests = computeSessionBests(sets);
  const get = (t: string) => bests.find((b) => b.type === t)?.value ?? -1;
  assert.equal(get('max_weight'), 85);
  assert.equal(get('max_reps'), 8);
  assert.equal(get('max_volume'), 640); // 80*8
  assert.ok(get('est_1rm') >= 85);      // e1rm of 85x5 ~ 99.2
});

test('detectNewPRs only returns beaten types', () => {
  const prev = { max_weight: 90, max_reps: 5, max_volume: 600, est_1rm: 200 };
  const prs = detectNewPRs(sets, prev);
  const types = prs.map((p) => p.type).sort();
  // beats max_reps (8>5) and max_volume (640>600); not max_weight(85<90) nor e1rm(<200)
  assert.deepEqual(types, ['max_reps', 'max_volume']);
});

test('empty when no working sets', () => {
  assert.deepEqual(computeSessionBests([{ weightKg: 50, reps: 5, isWarmup: true }]), []);
});
