import { getDb } from '../database.js';

// Renvoie true si une ligne a bien été supprimée, false si l'ID n'existait
// pas — l'appelant peut ainsi distinguer les deux cas sans relire la base.
export function deleteScoreRecord(id) {
  return getDb().prepare('DELETE FROM score_records WHERE id = ?').run(id).changes > 0;
}
