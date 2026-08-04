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

const SAMPLE_SCORES = {
  tirs_recus: { pistolet: 1, plastron: 2, epaules: 3, dos: 4 },
  tirs_envoyes: { pistolet: 5, plastron: 6, epaules: 7, dos: 8 },
};

let recordId;

before(() => {
  initSchema();
  recordId = createScoreRecord('g', 'c', 'u', SAMPLE_SCORES);
});

after(() => {
  getDb().close();
  rmSync(scratchDir, { recursive: true, force: true });
});

test('rejette un nom de colonne malveillant (injection SQL) sans toucher la base', () => {
  const before = getDb().prepare('SELECT * FROM score_records WHERE id = ?').get(recordId);

  const malicious = [
    'tirs_recus_pistolet; DROP TABLE score_records;--',
    'tirs_recus_pistolet = 999 WHERE 1=1 --',
    'id',
    'guild_id',
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
  updateScoreField(recordId, 'tirs_recus_plastron', 99);
  const row = getDb().prepare('SELECT tirs_recus_plastron FROM score_records WHERE id = ?').get(recordId);
  assert.equal(row.tirs_recus_plastron, 99);
});
