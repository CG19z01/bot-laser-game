// La détection de doublons évite qu'une feuille scannée deux fois soit
// comptée deux fois dans /stats. On vérifie surtout les cas où elle ne doit
// PAS se déclencher : un faux positif ferait perdre une vraie partie.

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const scratchDir = mkdtempSync(join(tmpdir(), 'bot-laser-game-test-'));
process.env.BOT_DB_PATH = join(scratchDir, 'test.db');

const { getDb } = await import('../../../src/db/database.js');
const { initSchema } = await import('../../../src/db/initSchema.js');
const { createScoreRecord } = await import('../../../src/db/scores/createScoreRecord.js');
const { findDuplicateScore } = await import('../../../src/db/scores/findDuplicateScore.js');

function extraction({ effTir = '1.82', score = 2600, recusTotal = 26, donnesTotal = 39 } = {}) {
  return {
    pseudo: 'Smilke',
    effTir,
    score,
    recus: { av: 12, ar: 7, ep: 1, pi: 6 },
    donnes: { av: 23, ar: 6, ep: 4, pi: 6 },
    checks: {
      recus: { lu: recusTotal, attendu: recusTotal },
      donnes: { lu: donnesTotal, attendu: donnesTotal },
    },
  };
}

before(() => {
  initSchema();
  createScoreRecord('g1', 'c', 's', 'joueur-1', extraction());
});

after(() => {
  getDb().close();
  rmSync(scratchDir, { recursive: true, force: true });
});

test('repère une feuille déjà enregistrée', () => {
  const found = findDuplicateScore('g1', 'joueur-1', extraction());
  assert.ok(found, 'le doublon aurait dû être détecté');
  assert.ok(found.id > 0);
});

test('ne bloque pas une autre partie du même joueur', () => {
  assert.equal(findDuplicateScore('g1', 'joueur-1', extraction({ recusTotal: 31 })), null);
  assert.equal(findDuplicateScore('g1', 'joueur-1', extraction({ donnesTotal: 28 })), null);
  assert.equal(findDuplicateScore('g1', 'joueur-1', extraction({ score: 1800 })), null);
  assert.equal(findDuplicateScore('g1', 'joueur-1', extraction({ effTir: '2.30' })), null);
});

test('ne bloque pas la feuille identique d\'un autre joueur', () => {
  // Tous les joueurs d'une même partie ont des feuilles proches : la
  // détection doit rester propre à un joueur.
  assert.equal(findDuplicateScore('g1', 'joueur-2', extraction()), null);
});

test('ne bloque pas sur un autre serveur', () => {
  assert.equal(findDuplicateScore('g2', 'joueur-1', extraction()), null);
});

test('ne bloque rien si les deux totaux de contrôle sont illisibles', () => {
  const illisible = extraction();
  illisible.checks.recus.attendu = null;
  illisible.checks.donnes.attendu = null;
  assert.equal(findDuplicateScore('g1', 'joueur-1', illisible), null);
});
