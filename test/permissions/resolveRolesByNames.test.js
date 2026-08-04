import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveRolesByNames } from '../../src/permissions/resolveRolesByNames.js';
import { fakeGuild } from '../../test-support/fakeDiscord.js';

const guild = fakeGuild({
  roles: [
    { id: '1', name: 'Administrateur' },
    { id: '2', name: 'STAFF' },
  ],
});

test('résout un nom exact', () => {
  const [result] = resolveRolesByNames(guild, ['STAFF']);
  assert.equal(result.role.id, '2');
});

test('tolère un préfixe "@"', () => {
  const [result] = resolveRolesByNames(guild, ['@STAFF']);
  assert.equal(result.role.id, '2');
});

test('résout une mention <@&id>', () => {
  const [result] = resolveRolesByNames(guild, ['<@&1>']);
  assert.equal(result.role.id, '1');
});

test('signale un rôle introuvable en gardant le texte brut', () => {
  const [result] = resolveRolesByNames(guild, ['RoleInexistant']);
  assert.equal(result.role, undefined);
  assert.equal(result.raw, 'RoleInexistant');
});

test('résout plusieurs noms dans l\'ordre fourni', () => {
  const results = resolveRolesByNames(guild, ['STAFF', 'Administrateur']);
  assert.deepEqual(results.map((r) => r.role.id), ['2', '1']);
});
