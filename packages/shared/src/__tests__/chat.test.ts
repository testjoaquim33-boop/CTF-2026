import { test } from 'node:test';
import assert from 'node:assert/strict';
import { trimChatHistory, mentionsPainOrInjury, type ChatMessage, type ChatRole } from '../chat.ts';

test('trimChatHistory drops empties and clamps content', () => {
  const msgs: ChatMessage[] = [
    { role: 'user', content: '  hello  ' },
    { role: 'assistant', content: '' },
    { role: 'user', content: 'x'.repeat(5000) },
  ];
  const out = trimChatHistory(msgs, 20, 100);
  assert.equal(out.length, 2);
  assert.equal(out[0]!.content, 'hello');            // trimmed
  assert.equal(out[1]!.content.length, 100);         // clamped
});

test('trimChatHistory keeps only last N turns', () => {
  const msgs: ChatMessage[] = Array.from({ length: 30 }, (_, i) => ({
    role: (i % 2 === 0 ? 'user' : 'assistant') as ChatRole,
    content: `m${i}`,
  }));
  const out = trimChatHistory(msgs, 6);
  assert.equal(out.length, 6);
  assert.equal(out[out.length - 1]!.content, 'm29');
});

test('trimChatHistory ensures first message is user', () => {
  const msgs: ChatMessage[] = [
    { role: 'assistant', content: 'greeting' }, // leading assistant must be dropped
    { role: 'user', content: 'hi' },
    { role: 'assistant', content: 'hello' },
  ];
  const out = trimChatHistory(msgs, 20);
  assert.equal(out[0]!.role, 'user');
  assert.equal(out.length, 2);
});

test('trimChatHistory filters invalid roles', () => {
  const msgs = [
    { role: 'system', content: 'ignore me' },
    { role: 'user', content: 'ok' },
  ] as unknown as ChatMessage[];
  const out = trimChatHistory(msgs, 20);
  assert.equal(out.length, 1);
  assert.equal(out[0]!.content, 'ok');
});

test('mentionsPainOrInjury', () => {
  assert.equal(mentionsPainOrInjury("j'ai une douleur au genou"), true);
  assert.equal(mentionsPainOrInjury('je me suis blessé au dos'), true);
  assert.equal(mentionsPainOrInjury('quel programme pour les pecs ?'), false);
});
