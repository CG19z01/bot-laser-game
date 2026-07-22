import { getDb } from '../database.js';

export function upsertAutoroleRole(guildId, emojiKey, emojiDisplay, roleId, messageId) {
  getDb()
    .prepare(
      `INSERT INTO autorole_roles (guild_id, emoji_key, emoji_display, role_id, message_id)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(guild_id, emoji_key) DO UPDATE SET
         emoji_display = excluded.emoji_display,
         role_id = excluded.role_id,
         message_id = excluded.message_id`
    )
    .run(guildId, emojiKey, emojiDisplay, roleId, messageId);
}
