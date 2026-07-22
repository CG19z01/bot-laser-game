import { getDb } from '../database.js';

export function getAutoroleRoleForReaction(guildId, messageId, emojiKey) {
  const row = getDb()
    .prepare(
      'SELECT role_id FROM autorole_roles WHERE guild_id = ? AND message_id = ? AND emoji_key = ?'
    )
    .get(guildId, messageId, emojiKey);

  return row?.role_id ?? null;
}
