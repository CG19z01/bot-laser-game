import { getDb } from '../database.js';

export function upsertAutoroleRole(guildId, emojiKey, emojiDisplay, roleId, messageId) {
  getDb()
    .prepare(
      `INSERT INTO autorole_roles (guild_id, emoji_key, emoji_display, role_id, message_id, position)
       VALUES (
         ?, ?, ?, ?, ?,
         (SELECT COALESCE(MAX(position), -1) + 1 FROM autorole_roles WHERE guild_id = ?)
       )
       ON CONFLICT(guild_id, emoji_key) DO UPDATE SET
         emoji_display = excluded.emoji_display,
         role_id = excluded.role_id,
         message_id = excluded.message_id`
    )
    .run(guildId, emojiKey, emojiDisplay, roleId, messageId, guildId);
}
