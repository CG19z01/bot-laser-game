// Régression : quand le message de rôles est recréé (supprimé
// entre-temps), TOUTES les lignes de la guilde doivent suivre le nouveau
// message_id — sinon seules les promos dont l'émoji vient d'être
// re-ajouté restent fonctionnelles, les autres pointent vers un message
// mort. Base temporaire (BOT_DB_PATH), jamais data/bot.db.

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const scratchDir = mkdtempSync(join(tmpdir(), 'bot-laser-game-test-'));
process.env.BOT_DB_PATH = join(scratchDir, 'test.db');

const { getDb } = await import('../../../src/db/database.js');
const { initSchema } = await import('../../../src/db/initSchema.js');
const { upsertAutoroleRole } = await import('../../../src/db/autorole/upsertAutoroleRole.js');
const { updateAutoroleMessageId } = await import('../../../src/db/autorole/updateAutoroleMessageId.js');
const { getAutoroleRoles } = await import('../../../src/db/autorole/getAutoroleRoles.js');

before(() => initSchema());
after(() => {
  getDb().close();
  rmSync(scratchDir, { recursive: true, force: true });
});

test('met à jour message_id pour toutes les lignes de la guilde, pas seulement une', () => {
  upsertAutoroleRole('guild-1', 'emoji1', '1️⃣', 'role-1', 'ancien-message');
  upsertAutoroleRole('guild-1', 'emoji2', '2️⃣', 'role-2', 'ancien-message');
  upsertAutoroleRole('guild-1', 'emoji3', '3️⃣', 'role-3', 'ancien-message');

  updateAutoroleMessageId('guild-1', 'nouveau-message');

  const roles = getAutoroleRoles('guild-1');
  assert.equal(roles.length, 3);
  for (const role of roles) {
    assert.equal(role.messageId, 'nouveau-message', `${role.emojiKey} devrait pointer vers le nouveau message`);
  }
});

test("n'affecte pas les lignes d'une autre guilde", () => {
  upsertAutoroleRole('guild-1', 'emojiA', 'A', 'role-a', 'msg-guild-1');
  upsertAutoroleRole('guild-2', 'emojiB', 'B', 'role-b', 'msg-guild-2');

  updateAutoroleMessageId('guild-1', 'nouveau-message-guild-1');

  const [roleGuild2] = getAutoroleRoles('guild-2');
  assert.equal(roleGuild2.messageId, 'msg-guild-2');
});
