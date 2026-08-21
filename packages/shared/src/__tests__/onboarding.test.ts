import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateStep, isDraftComplete, toPersistPayload, type OnboardingDraft,
} from '../onboarding.ts';

const full: OnboardingDraft = {
  objective: 'muscle', level: 'intermediate', experience: '1_3y',
  sessionsPerWeek: 4, durationMinutes: 60, location: 'gym',
  equipment: ['barbell', 'dumbbell'], heightCm: 180, weightKg: 80,
  targetWeightKg: 78, sex: 'male', birthYear: 1995,
};

test('validateStep: each step requires its field', () => {
  assert.equal(validateStep('objective', {}), 'select_objective');
  assert.equal(validateStep('equipment', { equipment: [] }), 'select_equipment');
  assert.equal(validateStep('objective', full), null);
  assert.equal(validateStep('equipment', full), null);
});

test('body validation bounds', () => {
  assert.equal(validateStep('body', { ...full, heightCm: 50 }), 'invalid_height');
  assert.equal(validateStep('body', { ...full, weightKg: 10 }), 'invalid_weight');
  assert.equal(validateStep('body', { ...full, targetWeightKg: 999 }), 'invalid_target_weight');
  assert.equal(validateStep('body', { ...full, birthYear: 1850 }), 'invalid_birth_year');
  assert.equal(validateStep('body', full), null);
});

test('optional fields (target/sex/age) may be omitted', () => {
  const d: OnboardingDraft = { ...full, targetWeightKg: undefined, sex: undefined, birthYear: undefined };
  assert.equal(validateStep('body', d), null);
  assert.equal(isDraftComplete(d), true);
});

test('isDraftComplete false when missing a step', () => {
  const { objective, ...rest } = full;
  assert.equal(isDraftComplete(rest as OnboardingDraft), false);
});

test('toPersistPayload maps to DB shapes', () => {
  const p = toPersistPayload(full);
  assert.equal(p.goal.type, 'muscle');
  assert.equal(p.goal.sessions_per_week, 4);
  assert.equal(p.goal.session_minutes, 60);
  assert.equal(p.profile.height_cm, 180);
  assert.equal(p.bodyMetric.weight_kg, 80);
  assert.deepEqual(p.onboarding.equipment, ['barbell', 'dumbbell']);
});

test('toPersistPayload throws on incomplete draft', () => {
  assert.throws(() => toPersistPayload({}), /onboarding_incomplete/);
});
