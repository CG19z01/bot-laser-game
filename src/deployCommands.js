import { REST, Routes } from 'discord.js';
import { loadEnv } from './config/env.js';
import { loadCommands } from './utils/loadCommands.js';

const env = loadEnv();
const commands = await loadCommands();
const rest = new REST({ version: '10' }).setToken(env.token);

const body = [...commands.values()].map((command) => command.data.toJSON());

await rest.put(Routes.applicationGuildCommands(env.clientId, env.guildId), { body });

console.log(`${body.length} commande(s) déployée(s) sur le serveur ${env.guildId}.`);
