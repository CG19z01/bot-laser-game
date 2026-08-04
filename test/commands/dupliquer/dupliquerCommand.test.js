// Sécurité : buildOverwrites() garantit que la catégorie dupliquée est
// privée par défaut (@everyone refusé) et que seuls les rôles explicitement
// listés reçoivent l'accès — pas de fuite vers un rôle non demandé.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PermissionFlagsBits } from 'discord.js';
import { buildOverwrites } from '../../../src/commands/dupliquer/dupliquerCommand.js';

test('@everyone est toujours refusé (ViewChannel)', () => {
  const overwrites = buildOverwrites('everyone-id', []);
  const everyone = overwrites.find((o) => o.id === 'everyone-id');
  assert.deepEqual(everyone.deny, [PermissionFlagsBits.ViewChannel]);
});

test('seuls les rôles listés reçoivent un overwrite d\'accès', () => {
  const roles = [{ id: 'r1' }, { id: 'r2' }];
  const overwrites = buildOverwrites('everyone-id', roles);
  const ids = overwrites.map((o) => o.id).sort();
  assert.deepEqual(ids, ['everyone-id', 'r1', 'r2'].sort());
});

test('un rôle non listé ne reçoit aucun overwrite', () => {
  const overwrites = buildOverwrites('everyone-id', [{ id: 'r1' }]);
  assert.equal(overwrites.some((o) => o.id === 'r-non-liste'), false);
});

test('les rôles listés reçoivent ViewChannel dans leur allow', () => {
  const overwrites = buildOverwrites('everyone-id', [{ id: 'r1' }]);
  const r1 = overwrites.find((o) => o.id === 'r1');
  assert.ok(r1.allow.includes(PermissionFlagsBits.ViewChannel));
});
