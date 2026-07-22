import { getDb } from '../database.js';

export function setAntispamAction(guildId, action, muteDurationSeconds = null) {
  getDb()
    .prepare(
      `INSERT INTO antispam_config (guild_id, action, mute_duration_seconds)
       VALUES (?, ?, ?)
       ON CONFLICT(guild_id) DO UPDATE SET
         action = excluded.action,
         mute_duration_seconds = excluded.mute_duration_seconds`
    )
    .run(guildId, action, muteDurationSeconds);
}
