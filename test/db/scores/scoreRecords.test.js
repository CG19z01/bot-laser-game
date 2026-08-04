// Round-trip createScoreRecord() -> getScoreRecord(), sur une base
// temporaire (jamais data/bot.db). Réutilise initSchema() plutôt que de
// dupliquer le SQL de création de table.

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

before(() => initSchema());
after(() => {
  getDb().close();
  rmSync(scratchDir, { recursive: true, force: true });
});

test('createScoreRecord puis getScoreRecord renvoie les mêmes valeurs', () => {
  const scores = {
    tirs_recus: { pistolet: 3, plastron: 12, epaules: 1, dos: 0 },
    tirs_envoyes: { pistolet: 5, plastron: 8, epaules: 2, dos: 1 },
  };

  const id = createScoreRecord('guild-1', 'channel-1', 'user-1', scores);
  const record = getScoreRecord(id);

  assert.equal(record.guild_id, 'guild-1');
  assert.equal(record.channel_id, 'channel-1');
  assert.equal(record.submitted_by, 'user-1');
  assert.equal(record.tirs_recus_pistolet, 3);
  assert.equal(record.tirs_recus_plastron, 12);
  assert.equal(record.tirs_recus_epaules, 1);
  assert.equal(record.tirs_recus_dos, 0);
  assert.equal(record.tirs_envoyes_pistolet, 5);
  assert.equal(record.tirs_envoyes_plastron, 8);
  assert.equal(record.tirs_envoyes_epaules, 2);
  assert.equal(record.tirs_envoyes_dos, 1);
});

test('getScoreRecord renvoie undefined pour un ID inexistant', () => {
  assert.equal(getScoreRecord(999999), undefined);
});

test('chaque appel à createScoreRecord génère un ID différent', () => {
  const scores = {
    tirs_recus: { pistolet: 0, plastron: 0, epaules: 0, dos: 0 },
    tirs_envoyes: { pistolet: 0, plastron: 0, epaules: 0, dos: 0 },
  };
  const id1 = createScoreRecord('g', 'c', 'u', scores);
  const id2 = createScoreRecord('g', 'c', 'u', scores);
  assert.notEqual(id1, id2);
});
