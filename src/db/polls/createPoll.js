import { getDb } from '../database.js';

export function createPoll(messageId, guildId, channelId, dates, threshold) {
  getDb()
    .prepare(
      `INSERT INTO polls (message_id, guild_id, channel_id, dates, threshold)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(messageId, guildId, channelId, JSON.stringify(dates), threshold);
}
