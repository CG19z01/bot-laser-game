import { getDb } from '../database.js';

export function updateAutoroleMessageId(guildId, messageId) {
  getDb().prepare('UPDATE autorole_roles SET message_id = ? WHERE guild_id = ?').run(messageId, guildId);
}
