import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Collection } from 'discord.js';

const COMMANDS_DIR = join(dirname(fileURLToPath(import.meta.url)), '../commands');

export async function loadCommands() {
  const commands = new Collection();

  for (const folder of readdirSync(COMMANDS_DIR)) {
    const folderPath = join(COMMANDS_DIR, folder);
    for (const file of readdirSync(folderPath).filter((f) => f.endsWith('.js'))) {
      const { default: command } = await import(pathToFileURL(join(folderPath, file)));
      commands.set(command.data.name, command);
    }
  }

  return commands;
}
