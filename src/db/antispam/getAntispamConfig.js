import { getDb } from '../database.js';

const DEFAULTS = { maxMessages: 5, windowSeconds: 5, action: 'delete', muteDurationSeconds: null };

export function getAntispamConfig(guildId) {
  const row = getDb()
    .prepare(
      'SELECT max_messages, window_seconds, action, mute_duration_seconds FROM antispam_config WHERE guild_id = ?'
    )
    .get(guildId);

  if (!row) return DEFAULTS;

  return {
    maxMessages: row.max_messages,
    windowSeconds: row.window_seconds,
    action: row.action,
    muteDurationSeconds: row.mute_duration_seconds,
  };
}
