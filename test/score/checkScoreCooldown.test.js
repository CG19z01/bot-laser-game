// /score est ouverte à tous et lance un worker Tesseract coûteux : ce
// cooldown est le garde-fou contre le spam. Les tests vérifient surtout
// qu'aucun rôle ne contourne involontairement la limite et que le délai
// expire bien.

import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { checkScoreCooldown } from '../../src/score/checkScoreCooldown.js';
import { DEFAULT_SCORE_COOLDOWN_MS } from '../../src/config/scoreConfig.js';
import { fakeMember } from '../../test-support/fakeDiscord.js';

const realNow = Date.now;
afterEach(() => {
  Date.now = realNow;
});

// Chaque test utilise un identifiant distinct : l'état du cooldown est un
// Map partagé au niveau du module, il n'est pas réinitialisé entre tests.
let userCounter = 0;
function uniqueMember(roleNames) {
  userCounter += 1;
  return fakeMember(roleNames, `user-${userCounter}`);
}

test('Administrateur et STAFF ne sont jamais limités', () => {
  const admin = uniqueMember(['Administrateur']);
  const staff = uniqueMember(['STAFF']);

  for (let i = 0; i < 5; i++) {
    assert.equal(checkScoreCooldown('guild-1', admin), 0);
    assert.equal(checkScoreCooldown('guild-1', staff), 0);
  }
});

test('un membre sans rôle est limité après le premier appel', () => {
  const member = uniqueMember([]);
  assert.equal(checkScoreCooldown('guild-1', member), 0, 'premier appel autorisé');

  const wait = checkScoreCooldown('guild-1', member);
  assert.ok(wait > 0, 'deuxième appel immédiat refusé');
  assert.ok(wait <= DEFAULT_SCORE_COOLDOWN_MS / 1000);
});

test('Référant est limité, mais moins longtemps qu\'un membre sans rôle', () => {
  const referent = uniqueMember(['Référant']);
  const lambda = uniqueMember([]);

  checkScoreCooldown('guild-1', referent);
  checkScoreCooldown('guild-1', lambda);

  const waitReferent = checkScoreCooldown('guild-1', referent);
  const waitLambda = checkScoreCooldown('guild-1', lambda);

  assert.ok(waitReferent > 0);
  assert.ok(waitLambda > waitReferent, 'le membre sans rôle doit attendre plus longtemps');
});

test('le rôle le plus permissif gagne quand un membre en cumule plusieurs', () => {
  const member = uniqueMember(['Référant', 'STAFF']);
  for (let i = 0; i < 3; i++) {
    assert.equal(checkScoreCooldown('guild-1', member), 0, 'STAFF (0s) doit primer sur Référant (10s)');
  }
});

test('le cooldown expire après le délai', () => {
  const member = uniqueMember([]);
  const start = realNow();

  Date.now = () => start;
  assert.equal(checkScoreCooldown('guild-1', member), 0);
  assert.ok(checkScoreCooldown('guild-1', member) > 0);

  Date.now = () => start + DEFAULT_SCORE_COOLDOWN_MS + 1;
  assert.equal(checkScoreCooldown('guild-1', member), 0, 'doit être à nouveau autorisé');
});

test('deux membres différents ont des cooldowns indépendants', () => {
  const first = uniqueMember([]);
  const second = uniqueMember([]);

  assert.equal(checkScoreCooldown('guild-1', first), 0);
  assert.equal(checkScoreCooldown('guild-1', second), 0, 'le cooldown du premier ne doit pas bloquer le second');
});

test('le même membre a des cooldowns indépendants par serveur', () => {
  const member = uniqueMember([]);

  assert.equal(checkScoreCooldown('guild-A', member), 0);
  assert.equal(checkScoreCooldown('guild-B', member), 0);
  assert.ok(checkScoreCooldown('guild-A', member) > 0);
});
