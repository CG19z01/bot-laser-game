import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeEmoji } from '../../src/autorole/normalizeEmoji.js';

test('extrait l\'ID d\'un émoji custom statique', () => {
  assert.equal(normalizeEmoji('<:cdp25:123456789012345678>'), '123456789012345678');
});

test('extrait l\'ID d\'un émoji custom animé', () => {
  assert.equal(normalizeEmoji('<a:wave:987654321098765432>'), '987654321098765432');
});

test('laisse un émoji unicode inchangé', () => {
  assert.equal(normalizeEmoji('🎮'), '🎮');
});

test('laisse une chaîne quelconque inchangée si elle ne matche pas le format custom', () => {
  assert.equal(normalizeEmoji('pas-un-emoji'), 'pas-un-emoji');
});
