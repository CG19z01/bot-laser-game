import { getDb } from '../database.js';

export function setPlayerPseudo(guildId, userId, pseudo) {
  getDb()
    .prepare(
      `INSERT INTO player_pseudos (guild_id, user_id, pseudo) VALUES (?, ?, ?)
       ON CONFLICT(guild_id, user_id) DO UPDATE SET pseudo = excluded.pseudo`
    )
    .run(guildId, userId, pseudo);
}
