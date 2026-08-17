import { getDb } from './database.js';
import { migrateScoreRecords } from './migrateScoreRecords.js';

export function initSchema() {
  getDb().exec(`
    CREATE TABLE IF NOT EXISTS autorole_roles (
      guild_id      TEXT NOT NULL,
      emoji_key     TEXT NOT NULL,
      emoji_display TEXT NOT NULL,
      role_id       TEXT NOT NULL,
      message_id    TEXT NOT NULL,
      position      INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (guild_id, emoji_key)
    );

    CREATE TABLE IF NOT EXISTS antispam_config (
      guild_id              TEXT PRIMARY KEY,
      max_messages          INTEGER NOT NULL DEFAULT 5,
      window_seconds        INTEGER NOT NULL DEFAULT 5,
      action                TEXT NOT NULL DEFAULT 'delete',
      mute_duration_seconds INTEGER
    );

    CREATE TABLE IF NOT EXISTS polls (
      message_id TEXT PRIMARY KEY,
      guild_id   TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      dates      TEXT NOT NULL,
      threshold  INTEGER NOT NULL,
      closed     INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS score_records (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id     TEXT NOT NULL,
      channel_id   TEXT NOT NULL,
      submitted_by TEXT NOT NULL,
      user_id      TEXT NOT NULL,
      pseudo       TEXT NOT NULL,
      eff_tir      TEXT,
      score        INTEGER,
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

    CREATE TABLE IF NOT EXISTS player_pseudos (
      guild_id TEXT NOT NULL,
      user_id  TEXT NOT NULL,
      pseudo   TEXT NOT NULL,
      PRIMARY KEY (guild_id, user_id)
    );
  `);

  const columns = getDb().prepare('PRAGMA table_info(autorole_roles)').all();
  if (!columns.some((column) => column.name === 'position')) {
    getDb().exec(`
      ALTER TABLE autorole_roles ADD COLUMN position INTEGER NOT NULL DEFAULT 0;
      UPDATE autorole_roles
      SET position = (
        SELECT COUNT(*) FROM autorole_roles AS r2
        WHERE r2.guild_id = autorole_roles.guild_id AND r2.rowid <= autorole_roles.rowid
      ) - 1;
    `);
  }

  migrateScoreRecords();
}
