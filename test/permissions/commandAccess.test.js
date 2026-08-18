// Filet de sécurité pour la règle CLAUDE.md « commandAccess.js doit rester
// synchronisé avec les commandes réelles ». Échoue si une commande est
// ajoutée sans entrée (elle serait alors listée à tout le monde par /aide,
// faute de condition connue) ou si une clé orpheline traîne après
// suppression d'une commande.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCommands } from '../../src/utils/loadCommands.js';
import { COMMAND_ACCESS } from '../../src/permissions/commandAccess.js';

test('chaque commande chargée a une entrée dans COMMAND_ACCESS, et inversement', async () => {
  const commands = await loadCommands();
  const commandNames = new Set(commands.keys());
  const declaredNames = new Set(Object.keys(COMMAND_ACCESS));

  const missing = [...commandNames].filter((n) => !declaredNames.has(n));
  const orphaned = [...declaredNames].filter((n) => !commandNames.has(n));

  assert.deepEqual(missing, [], `commande(s) sans entrée dans COMMAND_ACCESS: ${missing.join(', ')}`);
  assert.deepEqual(orphaned, [], `clé(s) orpheline(s) dans COMMAND_ACCESS: ${orphaned.join(', ')}`);
});

test('toute entrée non nulle déclare des rôles et un champ permission explicite', async () => {
  for (const [name, access] of Object.entries(COMMAND_ACCESS)) {
    if (access === null) continue;
    assert.ok(Array.isArray(access.roles) && access.roles.length > 0, `${name} : roles manquants`);
    // `permission` doit être présent même à null, pour que l'absence de
    // permission exigée soit un choix visible et non un oubli.
    assert.ok('permission' in access, `${name} : champ permission absent`);
  }
});
