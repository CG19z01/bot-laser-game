import { getDb } from '../database.js';

export function getPlayerPseudo(guildId, userId) {
  const row = getDb()
    .prepare('SELECT pseudo FROM player_pseudos WHERE guild_id = ? AND user_id = ?')
    .get(guildId, userId);
  return row?.pseudo ?? null;
}
