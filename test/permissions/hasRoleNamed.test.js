// Sécurité : hasRoleNamed() est le contrôle d'accès de base de tout le bot
// (utilisé par requireRole et directement par /copie-cat). Une comparaison
// insensible à la casse ou partielle ("Admin" matchant "Administrateur X")
// serait une faille de contournement de permission.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasRoleNamed } from '../../src/permissions/hasRoleNamed.js';
import { fakeMember } from '../../test-support/fakeDiscord.js';

test('autorise quand le membre a un rôle listé', () => {
  assert.equal(hasRoleNamed(fakeMember(['STAFF']), ['Administrateur', 'STAFF']), true);
});

test('refuse quand aucun rôle du membre ne correspond', () => {
  assert.equal(hasRoleNamed(fakeMember(['Membre']), ['Administrateur', 'STAFF']), false);
});

test('refuse quand le membre n\'a aucun rôle', () => {
  assert.equal(hasRoleNamed(fakeMember([]), ['Administrateur']), false);
});

test('refuse toujours quand la liste de rôles autorisés est vide', () => {
  assert.equal(hasRoleNamed(fakeMember(['Administrateur']), []), false);
});

test('la comparaison est sensible à la casse (pas de contournement "admin" vs "Administrateur")', () => {
  assert.equal(hasRoleNamed(fakeMember(['administrateur']), ['Administrateur']), false);
});

test('refuse une correspondance partielle ("Administrateur Junior" ne doit pas matcher "Administrateur")', () => {
  assert.equal(hasRoleNamed(fakeMember(['Administrateur Junior']), ['Administrateur']), false);
});

test('autorise si un des plusieurs rôles du membre correspond', () => {
  assert.equal(hasRoleNamed(fakeMember(['Membre', 'Référant', 'Ping']), ['Administrateur', 'Référant']), true);
});
