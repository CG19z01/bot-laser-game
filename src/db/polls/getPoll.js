import { getDb } from '../database.js';

export function getPoll(messageId) {
  const row = getDb()
    .prepare(
      'SELECT guild_id, channel_id, dates, threshold, closed FROM polls WHERE message_id = ?'
    )
    .get(messageId);

  if (!row) return null;

  return {
    guildId: row.guild_id,
    channelId: row.channel_id,
    dates: JSON.parse(row.dates),
    threshold: row.threshold,
    closed: row.closed === 1,
  };
}
