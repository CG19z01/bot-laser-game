// Cumul des parties d'un joueur : c'est ce que /stats affiche. On vérifie
// surtout que le cumul n'agrège pas les parties d'un autre joueur ni d'un
// autre serveur.

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
const { getPlayerTotals } = await import('../../../src/db/scores/getPlayerTotals.js');

function extraction(pseudo, recus, donnes) {
  const total = (z) => z.av + z.ar + z.ep + z.pi;
  return {
    pseudo,
    effTir: '1.82',
    score: 100,
    recus,
    donnes,
    checks: {
      recus: { lu: total(recus), attendu: total(recus) },
      donnes: { lu: total(donnes), attendu: total(donnes) },
    },
  };
}

before(() => {
  initSchema();
  // Deux parties du même joueur, sous DEUX pseudos différents : c'est le
  // cas que le regroupement par compte doit couvrir.
  createScoreRecord('g1', 'c', 's', 'joueur-1', extraction('Smilke', { av: 12, ar: 7, ep: 1, pi: 6 }, { av: 23, ar: 6, ep: 4, pi: 6 }));
  createScoreRecord('g1', 'c', 's', 'joueur-1', extraction('Smilk3', { av: 3, ar: 1, ep: 0, pi: 2 }, { av: 5, ar: 2, ep: 1, pi: 0 }));
  createScoreRecord('g1', 'c', 's', 'joueur-2', extraction('Auré', { av: 99, ar: 99, ep: 99, pi: 99 }, { av: 99, ar: 99, ep: 99, pi: 99 }));
  createScoreRecord('g2', 'c', 's', 'joueur-1', extraction('Smilke', { av: 50, ar: 50, ep: 50, pi: 50 }, { av: 50, ar: 50, ep: 50, pi: 50 }));
});

after(() => {
  getDb().close();
  rmSync(scratchDir, { recursive: true, force: true });
});

test('additionne les parties du joueur même sous des pseudos différents', () => {
  const totals = getPlayerTotals('g1', 'joueur-1');
  assert.equal(totals.parties, 2);
  assert.equal(totals.recus_av, 15);
  assert.equal(totals.recus_ar, 8);
  assert.equal(totals.recus_ep, 1);
  assert.equal(totals.recus_pi, 8);
  assert.equal(totals.donnes_av, 28);
  assert.equal(totals.donnes_ar, 8);
  assert.equal(totals.donnes_ep, 5);
  assert.equal(totals.donnes_pi, 6);
});

test('n\'agrège pas les parties d\'un autre serveur', () => {
  assert.equal(getPlayerTotals('g2', 'joueur-1').parties, 1);
});

test('ne compte pas les parties d\'un autre joueur', () => {
  assert.equal(getPlayerTotals('g1', 'joueur-2').parties, 1);
});

test('aucune partie -> compteur à zéro', () => {
  assert.equal(getPlayerTotals('g1', 'inconnu').parties, 0);
});
