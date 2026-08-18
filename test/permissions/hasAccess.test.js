// Cœur du contrôle d'accès : un rôle nommé NE SUFFIT PAS pour les commandes
// à fort impact, il faut aussi la permission Discord correspondante. C'est
// précisément le trou que ces tests verrouillent — sur le serveur réel, le
// rôle « Administrateur » ne portait aucune permission.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PermissionFlagsBits } from 'discord.js';
import { hasAccess } from '../../src/permissions/hasAccess.js';

function member(roleNames, permissions = 0n) {
  const roles = roleNames.map((name) => ({ name }));
  return {
    roles: { cache: { some: (fn) => roles.some(fn) } },
    permissions: { has: (flag) => (permissions & flag) === flag },
  };
}

const ADMIN_ACCESS = { roles: ['Administrateur'], permission: PermissionFlagsBits.Administrator };
const OPEN_ACCESS = { roles: ['Administrateur', 'STAFF', 'Référant'], permission: null };

test('commande ouverte : accès accordé sans condition', () => {
  assert.deepEqual(hasAccess(member([]), null), { allowed: true });
});

test('rôle décoratif sans permission Discord : REFUSÉ', () => {
  const result = hasAccess(member(['Administrateur']), ADMIN_ACCESS);
  assert.equal(result.allowed, false);
  assert.equal(result.reason, 'permission', 'doit signaler la permission, pas le rôle');
});

test('rôle et permission réunis : accordé', () => {
  assert.equal(hasAccess(member(['Administrateur'], PermissionFlagsBits.Administrator), ADMIN_ACCESS).allowed, true);
});

test('permission Discord sans le rôle attendu : refusé', () => {
  const result = hasAccess(member(['Membre'], PermissionFlagsBits.Administrator), ADMIN_ACCESS);
  assert.equal(result.allowed, false);
  assert.equal(result.reason, 'role');
});

test('une autre permission ne remplace pas celle exigée', () => {
  const result = hasAccess(member(['Administrateur'], PermissionFlagsBits.ManageMessages), ADMIN_ACCESS);
  assert.equal(result.allowed, false);
  assert.equal(result.reason, 'permission');
});

test('la permission Administrator couvre une exigence plus fine', () => {
  const access = { roles: ['Administrateur'], permission: PermissionFlagsBits.ManageChannels };
  const admin = member(['Administrateur'], PermissionFlagsBits.Administrator | PermissionFlagsBits.ManageChannels);
  assert.equal(hasAccess(admin, access).allowed, true);
});

test('sans permission exigée, le rôle suffit', () => {
  assert.equal(hasAccess(member(['Référant']), OPEN_ACCESS).allowed, true);
  assert.equal(hasAccess(member(['Membre']), OPEN_ACCESS).allowed, false);
});
