import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DB_PATH = join(dirname(fileURLToPath(import.meta.url)), '../../data/bot.db');
let dbInstance;

export function getDb() {
  if (!dbInstance) {
    mkdirSync(dirname(DB_PATH), { recursive: true });
    dbInstance = new Database(DB_PATH);
    dbInstance.pragma('journal_mode = WAL');
  }
  return dbInstance;
}
