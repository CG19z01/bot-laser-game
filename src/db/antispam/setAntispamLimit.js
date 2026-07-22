import { getDb } from '../database.js';

export function setAntispamLimit(guildId, maxMessages, windowSeconds) {
  getDb()
    .prepare(
      `INSERT INTO antispam_config (guild_id, max_messages, window_seconds)
       VALUES (?, ?, ?)
       ON CONFLICT(guild_id) DO UPDATE SET
         max_messages = excluded.max_messages,
         window_seconds = excluded.window_seconds`
    )
    .run(guildId, maxMessages, windowSeconds);
}
