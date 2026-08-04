import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// BOT_DB_PATH permet de rediriger la base vers un fichier temporaire dans
// les tests, sans jamais toucher à data/bot.db (données réelles du bot).
const DB_PATH = process.env.BOT_DB_PATH ?? join(dirname(fileURLToPath(import.meta.url)), '../../data/bot.db');
let dbInstance;

export function getDb() {
  if (!dbInstance) {
    mkdirSync(dirname(DB_PATH), { recursive: true });
    dbInstance = new Database(DB_PATH);
    dbInstance.pragma('journal_mode = WAL');
  }
  return dbInstance;
}
