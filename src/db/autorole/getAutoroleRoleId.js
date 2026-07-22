import { getDb } from '../database.js';

export function getAutoroleRoleId(guildId) {
  const row = getDb()
    .prepare('SELECT role_id FROM autorole_config WHERE guild_id = ?')
    .get(guildId);
  return row?.role_id ?? null;
}
