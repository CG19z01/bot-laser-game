import { getDb } from '../database.js';

// SQLite ne permet pas de paramétrer un nom de colonne — `field` est donc
// vérifié contre cette liste fixe avant d'être interpolé dans le SQL, ce qui
// exclut toute injection (une valeur hors liste lève une erreur au lieu
// d'atteindre la requête).
const FIELD_COLUMNS = [
  'recus_av',
  'recus_ar',
  'recus_ep',
  'recus_pi',
  'donnes_av',
  'donnes_ar',
  'donnes_ep',
  'donnes_pi',
];

export function updateScoreField(id, field, value) {
  if (!FIELD_COLUMNS.includes(field)) {
    throw new Error(`Champ inconnu: ${field}`);
  }

  getDb().prepare(`UPDATE score_records SET ${field} = ? WHERE id = ?`).run(value, id);
}
