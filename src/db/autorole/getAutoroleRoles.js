import { getDb } from '../database.js';

export function getAutoroleRoles(guildId) {
  return getDb()
    .prepare(
      'SELECT emoji_key, emoji_display, role_id, message_id FROM autorole_roles WHERE guild_id = ?'
    )
    .all(guildId)
    .map((row) => ({
      emojiKey: row.emoji_key,
      emojiDisplay: row.emoji_display,
      roleId: row.role_id,
      messageId: row.message_id,
    }));
}
