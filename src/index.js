import { Client, GatewayIntentBits } from 'discord.js';
import { loadEnv } from './config/env.js';
import { initSchema } from './db/initSchema.js';
import { loadCommands } from './utils/loadCommands.js';
import { loadEvents } from './utils/loadEvents.js';

const env = loadEnv();
initSchema();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
  ],
});

client.commands = await loadCommands();
await loadEvents(client);

client.login(env.token);
