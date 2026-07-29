import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const EVENTS_DIR = join(dirname(fileURLToPath(import.meta.url)), '../events');

export async function loadEvents(client) {
  for (const file of readdirSync(EVENTS_DIR).filter((f) => f.endsWith('.js'))) {
    const { default: event } = await import(pathToFileURL(join(EVENTS_DIR, file)));
    client.on(event.name, (...args) => {
      Promise.resolve(event.execute(...args)).catch((error) =>
        console.error(`[${file}] Erreur non gérée:`, error)
      );
    });
  }
}
