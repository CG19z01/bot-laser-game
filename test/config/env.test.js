// Sécurité/fiabilité : loadEnv() doit échouer immédiatement (fail-fast) si
// une variable requise manque, plutôt que de laisser le bot démarrer dans
// un état à moitié configuré.

import { test } from 'node:test';
import assert from 'node:assert/strict';

const REQUIRED_VARS = [
  'DISCORD_TOKEN',
  'CLIENT_ID',
  'GUILD_ID',
  'ADMIN_CHANNEL_ID',
  'ROLE_CHANNEL_ID',
  'LOG_CHANNEL_ID',
];
const DUMMY_VALUES = Object.fromEntries(REQUIRED_VARS.map((key) => [key, `test-${key}`]));

// dotenv/config (importé par env.js) ne remplace jamais une variable déjà
// définie — fixer des valeurs factices avant l'import rend le test
// indépendant du .env réel de la machine.
for (const [key, value] of Object.entries(DUMMY_VALUES)) {
  process.env[key] = value;
}

const { loadEnv } = await import('../../src/config/env.js');

test('charge toutes les variables requises quand elles sont présentes', () => {
  const env = loadEnv();
  assert.equal(env.token, DUMMY_VALUES.DISCORD_TOKEN);
  assert.equal(env.clientId, DUMMY_VALUES.CLIENT_ID);
  assert.equal(env.guildId, DUMMY_VALUES.GUILD_ID);
  assert.equal(env.adminChannelId, DUMMY_VALUES.ADMIN_CHANNEL_ID);
  assert.equal(env.roleChannelId, DUMMY_VALUES.ROLE_CHANNEL_ID);
  assert.equal(env.logChannelId, DUMMY_VALUES.LOG_CHANNEL_ID);
});

test('échoue explicitement si une variable requise manque', () => {
  const original = process.env.LOG_CHANNEL_ID;
  delete process.env.LOG_CHANNEL_ID;
  try {
    assert.throws(() => loadEnv(), /Variable d'environnement manquante: LOG_CHANNEL_ID/);
  } finally {
    process.env.LOG_CHANNEL_ID = original;
  }
});
