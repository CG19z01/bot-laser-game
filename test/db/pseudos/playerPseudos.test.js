// Le lien pseudo <-> compte Discord conditionne à qui /stats attribue les
// parties : on vérifie l'écrasement (un joueur qui change de pseudo) et
// l'isolation entre serveurs.

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const scratchDir = mkdtempSync(join(tmpdir(), 'bot-laser-game-test-'));
process.env.BOT_DB_PATH = join(scratchDir, 'test.db');

const { getDb } = await import('../../../src/db/database.js');
const { initSchema } = await import('../../../src/db/initSchema.js');
const { setPlayerPseudo } = await import('../../../src/db/pseudos/setPlayerPseudo.js');
const { getPlayerPseudo } = await import('../../../src/db/pseudos/getPlayerPseudo.js');

before(() => initSchema());
after(() => {
  getDb().close();
  rmSync(scratchDir, { recursive: true, force: true });
});

test('enregistre puis relit un pseudo', () => {
  setPlayerPseudo('guild-1', 'user-1', 'Smilke');
  assert.equal(getPlayerPseudo('guild-1', 'user-1'), 'Smilke');
});

test('un second appel remplace le pseudo au lieu de le dupliquer', () => {
  setPlayerPseudo('guild-1', 'user-2', 'Ancien');
  setPlayerPseudo('guild-1', 'user-2', 'Nouveau');
  assert.equal(getPlayerPseudo('guild-1', 'user-2'), 'Nouveau');

  const { count } = getDb()
    .prepare('SELECT COUNT(*) AS count FROM player_pseudos WHERE guild_id = ? AND user_id = ?')
    .get('guild-1', 'user-2');
  assert.equal(count, 1);
});

test('renvoie null pour un membre sans pseudo enregistré', () => {
  assert.equal(getPlayerPseudo('guild-1', 'inconnu'), null);
});

test('les pseudos sont isolés par serveur', () => {
  setPlayerPseudo('guild-A', 'user-3', 'PseudoA');
  setPlayerPseudo('guild-B', 'user-3', 'PseudoB');
  assert.equal(getPlayerPseudo('guild-A', 'user-3'), 'PseudoA');
  assert.equal(getPlayerPseudo('guild-B', 'user-3'), 'PseudoB');
});
