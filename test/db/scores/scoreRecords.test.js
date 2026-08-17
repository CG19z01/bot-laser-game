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

const EXTRACTION = {
  pseudo: 'Smilke',
  effTir: '1.82',
  score: 2600,
  recus: { av: 12, ar: 7, ep: 1, pi: 6 },
  donnes: { av: 23, ar: 6, ep: 4, pi: 6 },
};

before(() => initSchema());
after(() => {
  getDb().close();
  rmSync(scratchDir, { recursive: true, force: true });
});

test('createScoreRecord puis getScoreRecord renvoie les mêmes valeurs', () => {
  const id = createScoreRecord('guild-1', 'channel-1', 'submitter-1', 'user-1', EXTRACTION);
  const record = getScoreRecord(id);

  assert.equal(record.guild_id, 'guild-1');
  assert.equal(record.channel_id, 'channel-1');
  assert.equal(record.submitted_by, 'submitter-1');
  assert.equal(record.user_id, 'user-1');
  assert.equal(record.pseudo, 'Smilke');
  assert.equal(record.eff_tir, '1.82');
  assert.equal(record.score, 2600);
  assert.equal(record.recus_av, 12);
  assert.equal(record.recus_ar, 7);
  assert.equal(record.recus_ep, 1);
  assert.equal(record.recus_pi, 6);
  assert.equal(record.donnes_av, 23);
  assert.equal(record.donnes_ar, 6);
  assert.equal(record.donnes_ep, 4);
  assert.equal(record.donnes_pi, 6);
});

test('getScoreRecord renvoie undefined pour un ID inexistant', () => {
  assert.equal(getScoreRecord(999999), undefined);
});

test('chaque appel à createScoreRecord génère un ID différent', () => {
  const id1 = createScoreRecord('g', 'c', 's', 'u', EXTRACTION);
  const id2 = createScoreRecord('g', 'c', 's', 'u', EXTRACTION);
  assert.notEqual(id1, id2);
});
