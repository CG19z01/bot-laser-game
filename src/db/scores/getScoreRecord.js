import { getDb } from '../database.js';

export function getScoreRecord(id) {
  return getDb().prepare('SELECT * FROM score_records WHERE id = ?').get(id);
}
