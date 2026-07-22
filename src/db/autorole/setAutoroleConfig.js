import { getDb } from '../database.js';

export function setAutoroleConfig(guildId, roleId, messageId) {
  getDb()
    .prepare(
      `INSERT INTO autorole_config (guild_id, role_id, message_id)
       VALUES (?, ?, ?)
       ON CONFLICT(guild_id) DO UPDATE SET
         role_id = excluded.role_id,
         message_id = excluded.message_id`
    )
    .run(guildId, roleId, messageId);
}
