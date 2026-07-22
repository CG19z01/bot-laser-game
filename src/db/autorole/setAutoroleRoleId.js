import { getDb } from '../database.js';

export function setAutoroleRoleId(guildId, roleId) {
  getDb()
    .prepare(
      `INSERT INTO autorole_config (guild_id, role_id) VALUES (?, ?)
       ON CONFLICT(guild_id) DO UPDATE SET role_id = excluded.role_id`
    )
    .run(guildId, roleId);
}
