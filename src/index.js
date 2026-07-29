import { Client, GatewayIntentBits } from 'discord.js';
import { loadEnv } from './config/env.js';
import { initSchema } from './db/initSchema.js';
import { loadCommands } from './utils/loadCommands.js';
import { loadEvents } from './utils/loadEvents.js';
import { sendLog } from './logs/sendLog.js';

const env = loadEnv();
initSchema();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

client.env = env;
client.commands = await loadCommands();
await loadEvents(client);

async function shutdown() {
  await sendLog(client, '🔴 Bot déconnecté (arrêt manuel).');
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

client.login(env.token);
