// Remplace l'ancienne table score_records (zones pistolet/plastron/épaules/
// dos, sans pseudo) par la nouvelle (zones av/ar/ep/pi, avec pseudo, eff_tir
// et score), quand une base créée avant la refonte est ouverte.
//
// La bascule n'est faite que si l'ancienne table est VIDE. Les colonnes ne
// se correspondent pas d'une version à l'autre (l'ancienne extraction ne
// distinguait même pas les joueurs), donc il n'y a rien à convertir : mieux
// vaut refuser bruyamment que d'inventer une correspondance et perdre des
// données réelles.

import { getDb } from './database.js';

// Toute base dépourvue de cette colonne est antérieure à la refonte.
const REQUIRED_COLUMN = 'recus_total';

export function migrateScoreRecords() {
  const columns = getDb().prepare('PRAGMA table_info(score_records)').all();
  if (columns.length === 0) return;
  if (columns.some((column) => column.name === REQUIRED_COLUMN)) return;

  const { count } = getDb().prepare('SELECT COUNT(*) AS count FROM score_records').get();
  if (count > 0) {
    throw new Error(
      `score_records est à un format antérieur et contient ${count} ligne(s) : ` +
        'migration manuelle requise avant de démarrer.'
    );
  }

  getDb().exec(`
    DROP TABLE score_records;
    CREATE TABLE score_records (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id     TEXT NOT NULL,
      channel_id   TEXT NOT NULL,
      submitted_by TEXT NOT NULL,
      user_id      TEXT NOT NULL,
      pseudo       TEXT NOT NULL,
      eff_tir      TEXT,
      score        INTEGER,
      recus_total  INTEGER,
      donnes_total INTEGER,
      recus_av     INTEGER NOT NULL,
      recus_ar     INTEGER NOT NULL,
      recus_ep     INTEGER NOT NULL,
      recus_pi     INTEGER NOT NULL,
      donnes_av    INTEGER NOT NULL,
      donnes_ar    INTEGER NOT NULL,
      donnes_ep    INTEGER NOT NULL,
      donnes_pi    INTEGER NOT NULL,
      created_at   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}
