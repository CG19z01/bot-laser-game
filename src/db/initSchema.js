import { getDb } from './database.js';

export function initSchema() {
  getDb().exec(`
    CREATE TABLE IF NOT EXISTS autorole_config (
      guild_id TEXT PRIMARY KEY,
      role_id  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS antispam_config (
      guild_id              TEXT PRIMARY KEY,
      max_messages          INTEGER NOT NULL DEFAULT 5,
      window_seconds        INTEGER NOT NULL DEFAULT 5,
      action                TEXT NOT NULL DEFAULT 'delete',
      mute_duration_seconds INTEGER
    );
  `);
}
