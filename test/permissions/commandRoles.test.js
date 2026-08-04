// Filet de sécurité pour la règle CLAUDE.md "commandRoles.js doit rester
// synchronisé avec les commandes réelles" : jusqu'ici uniquement vérifiée
// à la main. Ce test échoue si une commande est ajoutée sans entrée dans
// COMMAND_ROLES (fail-open silencieux dans /aide, cf. revue de code), ou
// si une clé orpheline traîne dans COMMAND_ROLES après suppression d'une
// commande.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCommands } from '../../src/utils/loadCommands.js';
import { COMMAND_ROLES } from '../../src/permissions/commandRoles.js';

test('chaque commande chargée a une entrée dans COMMAND_ROLES, et inversement', async () => {
  const commands = await loadCommands();
  const commandNames = new Set(commands.keys());
  const declaredNames = new Set(Object.keys(COMMAND_ROLES));

  const missing = [...commandNames].filter((n) => !declaredNames.has(n));
  const orphaned = [...declaredNames].filter((n) => !commandNames.has(n));

  assert.deepEqual(missing, [], `commande(s) sans entrée dans COMMAND_ROLES: ${missing.join(', ')}`);
  assert.deepEqual(orphaned, [], `clé(s) orpheline(s) dans COMMAND_ROLES: ${orphaned.join(', ')}`);
});
