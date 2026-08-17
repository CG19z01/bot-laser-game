// Le cooldown doit être rendu quand l'appel s'arrête avant l'OCR : sinon un
// membre bloqué 60 s pour un pseudo mal saisi ne peut pas se corriger tout
// de suite. Il reste en revanche consommé après un OCR, sans quoi rescanner
// en boucle une feuille en doublon relancerait l'analyse à chaque fois.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkScoreCooldown, releaseScoreCooldown } from '../../src/score/checkScoreCooldown.js';
import { fakeMember } from '../../test-support/fakeDiscord.js';

let counter = 0;
function uniqueMember(roleNames = []) {
  counter += 1;
  return fakeMember(roleNames, `release-user-${counter}`);
}

test('après libération, le membre peut relancer immédiatement', () => {
  const member = uniqueMember();
  assert.equal(checkScoreCooldown('guild-1', member), 0);
  assert.ok(checkScoreCooldown('guild-1', member) > 0, 'bloqué sans libération');

  releaseScoreCooldown('guild-1', member);
  assert.equal(checkScoreCooldown('guild-1', member), 0, 'doit être à nouveau autorisé');
});

test('libérer ne débloque que le membre visé', () => {
  const first = uniqueMember();
  const second = uniqueMember();
  checkScoreCooldown('guild-1', first);
  checkScoreCooldown('guild-1', second);

  releaseScoreCooldown('guild-1', first);
  assert.equal(checkScoreCooldown('guild-1', first), 0);
  assert.ok(checkScoreCooldown('guild-1', second) > 0, 'le second reste soumis au délai');
});

test('libérer ne débloque que le serveur visé', () => {
  const member = uniqueMember();
  checkScoreCooldown('guild-A', member);
  checkScoreCooldown('guild-B', member);

  releaseScoreCooldown('guild-A', member);
  assert.equal(checkScoreCooldown('guild-A', member), 0);
  assert.ok(checkScoreCooldown('guild-B', member) > 0);
});

test('libérer un membre jamais enregistré ne lève pas d\'erreur', () => {
  assert.doesNotThrow(() => releaseScoreCooldown('guild-1', uniqueMember()));
});
