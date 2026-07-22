import { getDb } from '../database.js';

export function closePoll(messageId) {
  getDb().prepare('UPDATE polls SET closed = 1 WHERE message_id = ?').run(messageId);
}
