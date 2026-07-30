import { getDb } from '../database.js';

// SQLite ne permet pas de paramétrer un nom de colonne — `field` est donc
// vérifié contre cette liste fixe avant d'être interpolé dans le SQL, ce qui
// exclut toute injection (une valeur hors liste lève une erreur au lieu
// d'atteindre la requête).
const FIELD_COLUMNS = [
  'tirs_recus_pistolet',
  'tirs_recus_plastron',
  'tirs_recus_epaules',
  'tirs_recus_dos',
  'tirs_envoyes_pistolet',
  'tirs_envoyes_plastron',
  'tirs_envoyes_epaules',
  'tirs_envoyes_dos',
];

export function updateScoreField(id, field, value) {
  if (!FIELD_COLUMNS.includes(field)) {
    throw new Error(`Champ inconnu: ${field}`);
  }

  getDb().prepare(`UPDATE score_records SET ${field} = ? WHERE id = ?`).run(value, id);
}
