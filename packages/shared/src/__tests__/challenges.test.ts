import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidChallengeConfig,
  challengeProgress,
  isChallengeLive,
  daysRemaining,
} from '../challenges.ts';

test('isValidChallengeConfig: fail-closed', () => {
  assert.equal(isValidChallengeConfig({ metric: 'workouts', target: 10 }), true);
  assert.equal(isValidChallengeConfig({ metric: 'volume_kg', target: 50000 }), true);
  assert.equal(isValidChallengeConfig(null), false);
  assert.equal(isValidChallengeConfig({}), false);
  assert.equal(isValidChallengeConfig({ metric: 'workouts' }), false);      // no target
  assert.equal(isValidChallengeConfig({ metric: 'workouts', target: 0 }), false); // target must be > 0
  assert.equal(isValidChallengeConfig({ metric: 'bogus', target: 5 }), false);     // unknown metric
});

test('challengeProgress: clamps and completes', () => {
  const p = challengeProgress(4, 10);
  assert.equal(p.value, 4);
  assert.equal(p.target, 10);
  assert.ok(Math.abs(p.progress - 0.4) < 1e-9);
  assert.equal(p.remaining, 6);
  assert.equal(p.completed, false);

  const done = challengeProgress(12, 10);
  assert.equal(done.progress, 1);      // clamped
  assert.equal(done.remaining, 0);
  assert.equal(done.completed, true);

  const neg = challengeProgress(-3, 10);
  assert.equal(neg.value, 0);
  assert.equal(neg.progress, 0);
});

test('isChallengeLive: respects window + active flag', () => {
  const now = new Date('2026-06-15T12:00:00Z');
  assert.equal(isChallengeLive('2026-06-01T00:00:00Z', '2026-06-30T23:59:59Z', true, now), true);
  assert.equal(isChallengeLive('2026-07-01T00:00:00Z', '2026-07-31T00:00:00Z', true, now), false); // future
  assert.equal(isChallengeLive('2026-05-01T00:00:00Z', '2026-05-31T00:00:00Z', true, now), false); // past
  assert.equal(isChallengeLive('2026-06-01T00:00:00Z', '2026-06-30T00:00:00Z', false, now), false); // inactive
  assert.equal(isChallengeLive(null, null, true, now), true); // no bounds = always live if active
});

test('daysRemaining', () => {
  const now = new Date('2026-06-15T12:00:00Z');
  assert.equal(daysRemaining('2026-06-20T12:00:00Z', now), 5);
  assert.equal(daysRemaining('2026-06-15T11:00:00Z', now), 0); // already past
  assert.equal(daysRemaining(null, now), null);
});
