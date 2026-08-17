// Sécurité : updateScoreField() interpole `field` dans du SQL brut (les
// noms de colonnes ne se paramètrent pas). Ce test vérifie que la garde
// par allowlist bloque bien toute valeur hors des 8 colonnes connues
// AVANT d'atteindre la base — jamais après. Schéma et insertion réutilisent
// initSchema()/createScoreRecord() plutôt que de dupliquer le SQL.

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
const { updateScoreField } = await import('../../../src/db/scores/updateScoreField.js');

const SAMPLE_EXTRACTION = {
  pseudo: 'Smilke',
  effTir: '1.82',
  score: 2600,
  recus: { av: 1, ar: 2, ep: 3, pi: 4 },
  donnes: { av: 5, ar: 6, ep: 7, pi: 8 },
};

let recordId;

before(() => {
  initSchema();
  recordId = createScoreRecord('g', 'c', 's', 'u', SAMPLE_EXTRACTION);
});

after(() => {
  getDb().close();
  rmSync(scratchDir, { recursive: true, force: true });
});

test('rejette un nom de colonne malveillant (injection SQL) sans toucher la base', () => {
  const before = getDb().prepare('SELECT * FROM score_records WHERE id = ?').get(recordId);

  const malicious = [
    'recus_av; DROP TABLE score_records;--',
    'recus_av = 999 WHERE 1=1 --',
    'id',
    'guild_id',
    'pseudo',
    'created_at',
    "1) OR (1=1",
  ];

  for (const field of malicious) {
    assert.throws(() => updateScoreField(recordId, field, 42), /Champ inconnu/, `devrait rejeter: ${field}`);
  }

  const after = getDb().prepare('SELECT * FROM score_records WHERE id = ?').get(recordId);
  assert.deepEqual(after, before, 'aucune ligne ne doit avoir changé');

  const tableStillExists = getDb()
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='score_records'")
    .get();
  assert.ok(tableStillExists, 'la table ne doit pas avoir été supprimée');
});

test('met à jour un champ valide', () => {
  updateScoreField(recordId, 'recus_ar', 99);
  const row = getDb().prepare('SELECT recus_ar FROM score_records WHERE id = ?').get(recordId);
  assert.equal(row.recus_ar, 99);
});
