// La suppression est définitive : on vérifie qu'elle retire bien la ligne
// visée et RIEN d'autre, et qu'un ID inexistant ne fait pas croire à une
// suppression réussie.

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
const { getScoreRecord } = await import('../../../src/db/scores/getScoreRecord.js');
const { deleteScoreRecord } = await import('../../../src/db/scores/deleteScoreRecord.js');

const EXTRACTION = {
  pseudo: 'Smilke',
  effTir: '1.82',
  score: 2600,
  recus: { av: 12, ar: 7, ep: 1, pi: 6 },
  donnes: { av: 23, ar: 6, ep: 4, pi: 6 },
  checks: { recus: { lu: 26, attendu: 26 }, donnes: { lu: 39, attendu: 39 } },
};

let first;
let second;

before(() => {
  initSchema();
  first = createScoreRecord('g1', 'c', 's', 'joueur-1', EXTRACTION);
  second = createScoreRecord('g1', 'c', 's', 'joueur-1', EXTRACTION);
});

after(() => {
  getDb().close();
  rmSync(scratchDir, { recursive: true, force: true });
});

test('supprime la ligne visée et signale le succès', () => {
  assert.equal(deleteScoreRecord(first), true);
  assert.equal(getScoreRecord(first), undefined);
});

test('ne touche pas les autres parties', () => {
  assert.ok(getScoreRecord(second), 'la seconde partie doit rester intacte');
});

test('un ID inexistant renvoie false sans rien supprimer', () => {
  const { count: avant } = getDb().prepare('SELECT COUNT(*) AS count FROM score_records').get();
  assert.equal(deleteScoreRecord(999999), false);
  const { count: apres } = getDb().prepare('SELECT COUNT(*) AS count FROM score_records').get();
  assert.equal(apres, avant);
});

test('supprimer deux fois le même ID ne renvoie vrai qu\'une fois', () => {
  assert.equal(deleteScoreRecord(second), true);
  assert.equal(deleteScoreRecord(second), false);
});
