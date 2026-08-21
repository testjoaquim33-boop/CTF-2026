import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateEmail, validatePassword, passwordsMatch } from '../validators.ts';

test('validateEmail', () => {
  assert.equal(validateEmail('a@b.co').valid, true);
  assert.equal(validateEmail('').valid, false);
  assert.equal(validateEmail('nope').valid, false);
  assert.equal(validateEmail('a@b').valid, false);
});

test('validatePassword policy', () => {
  assert.equal(validatePassword('abcd1234').valid, true);
  assert.equal(validatePassword('short1').valid, false);       // too short
  assert.equal(validatePassword('allletters').valid, false);   // no number
  assert.equal(validatePassword('12345678').valid, false);     // no letter
});

test('passwordsMatch', () => {
  assert.equal(passwordsMatch('a','a').valid, true);
  assert.equal(passwordsMatch('a','b').valid, false);
});
