// Garde-fou contre les pings involontaires.
//
// `interaction.reply('texte')` avec une chaîne brute ne peut PAS porter
// d'`allowedMentions` : si le texte contient du contenu saisi par un membre
// (un pseudo, un nom de catégorie), un « @everyone » y pinguerait tout le
// serveur. C'est exactement ce qui s'était produit dans /edit-score.
//
// La règle vérifiée ici est donc simple et sans faux positif : toujours
// passer un objet d'options à reply/editReply/followUp, jamais une chaîne.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// fileURLToPath et non .pathname : le chemin du projet contient une
// espace, que .pathname rendrait encodée (%20) et illisible par fs.
const COMMANDS_DIR = fileURLToPath(new URL('../../src/commands', import.meta.url));

function collectFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? collectFiles(path) : path.endsWith('.js') ? [path] : [];
  });
}

test('aucune réponse Discord ne passe une chaîne brute au lieu d\'un objet', () => {
  const offenders = [];

  for (const file of collectFiles(COMMANDS_DIR)) {
    const source = readFileSync(file, 'utf8');
    source.split('\n').forEach((line, index) => {
      // reply(`...`) ou reply('...') : la forme qui ne peut pas porter
      // d'allowedMentions. reply({ ... }) est la forme attendue.
      if (/\.(reply|editReply|followUp)\(\s*[`'"]/.test(line)) {
        offenders.push(`${file.split('/src/')[1]}:${index + 1}`);
      }
    });
  }

  assert.deepEqual(
    offenders,
    [],
    `réponse(s) à convertir en objet + allowedMentions : ${offenders.join(', ')}`
  );
});
