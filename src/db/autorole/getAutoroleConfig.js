import { getDb } from '../database.js';

export function getAutoroleConfig(guildId) {
  const row = getDb()
    .prepare('SELECT role_id, message_id FROM autorole_config WHERE guild_id = ?')
    .get(guildId);

  if (!row) return null;

  return { roleId: row.role_id, messageId: row.message_id };
}
