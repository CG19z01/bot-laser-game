// Sécurité : buildOverwriteOptions() convertit un PermissionOverwrites en
// objet {flag: bool} réutilisé par /copie-perm pour recopier des
// permissions vers d'autres rôles. Une conversion incorrecte pourrait
// accorder ou faire fuiter une permission non voulue.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildOverwriteOptions } from '../../src/permissions/buildOverwriteOptions.js';
import { fakeOverwrite } from '../../test-support/fakeDiscord.js';

test('mappe allow -> true et deny -> false', () => {
  const overwrite = fakeOverwrite('role1', { allow: ['ViewChannel'], deny: ['SendMessages'] });
  assert.deepEqual(buildOverwriteOptions(overwrite), { ViewChannel: true, SendMessages: false });
});

test('overwrite vide -> objet vide (aucune permission accordée par défaut)', () => {
  const overwrite = fakeOverwrite('role1', {});
  assert.deepEqual(buildOverwriteOptions(overwrite), {});
});

test('ne fait pas fuiter de permission absente de allow/deny', () => {
  const overwrite = fakeOverwrite('role1', { allow: ['ViewChannel'] });
  const options = buildOverwriteOptions(overwrite);
  assert.equal('Administrator' in options, false);
  assert.equal('ManageGuild' in options, false);
  assert.deepEqual(options, { ViewChannel: true });
});
