import { getDb } from './database.js';

export function initSchema() {
  getDb().exec(`
    CREATE TABLE IF NOT EXISTS autorole_roles (
      guild_id      TEXT NOT NULL,
      emoji_key     TEXT NOT NULL,
      emoji_display TEXT NOT NULL,
      role_id       TEXT NOT NULL,
      message_id    TEXT NOT NULL,
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
  `);
}
