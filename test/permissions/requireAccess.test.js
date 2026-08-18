// Point d'entrée du contrôle d'accès pour presque toutes les commandes. Le
// message de refus doit distinguer « mauvais rôle » de « bon rôle mais
// permission Discord manquante » : le second se règle en cochant une case
// dans les paramètres du serveur, et sans ce détail le refus est
// incompréhensible pour la personne concernée.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MessageFlags, PermissionFlagsBits } from 'discord.js';
import { requireAccess } from '../../src/permissions/requireAccess.js';

function fakeInteraction({ roleNames = [], permissions = 0n, deferred = false } = {}) {
  const roles = roleNames.map((name) => ({ name }));
  const calls = { reply: [], editReply: [] };
  return {
    deferred,
    member: {
      roles: { cache: { some: (fn) => roles.some(fn) } },
      permissions: { has: (flag) => (permissions & flag) === flag },
    },
    reply: async (opts) => calls.reply.push(opts),
    editReply: async (opts) => calls.editReply.push(opts),
    calls,
  };
}

const ADMIN_ACCESS = { roles: ['Administrateur'], permission: PermissionFlagsBits.ManageRoles };

test('autorise sans répondre quand rôle et permission sont réunis', async () => {
  const interaction = fakeInteraction({
    roleNames: ['Administrateur'],
    permissions: PermissionFlagsBits.ManageRoles,
  });
  assert.equal(await requireAccess(interaction, ADMIN_ACCESS), true);
  assert.equal(interaction.calls.reply.length, 0);
  assert.equal(interaction.calls.editReply.length, 0);
});

test('mauvais rôle : refus mentionnant le rôle attendu', async () => {
  const interaction = fakeInteraction({ roleNames: ['Membre'] });
  assert.equal(await requireAccess(interaction, ADMIN_ACCESS), false);
  assert.match(interaction.calls.reply[0].content, /Réservé au rôle Administrateur/);
});

test('rôle correct mais permission absente : refus expliquant quoi cocher', async () => {
  const interaction = fakeInteraction({ roleNames: ['Administrateur'] });
  assert.equal(await requireAccess(interaction, ADMIN_ACCESS), false);
  const message = interaction.calls.reply[0].content;
  assert.match(message, /Gérer les rôles/, 'doit nommer la permission manquante');
  assert.match(message, /Paramètres du serveur/, "doit dire où l'accorder");
});

test('refus éphémère et sans mention active quand rien n\'est différé', async () => {
  const interaction = fakeInteraction({ roleNames: [] });
  await requireAccess(interaction, ADMIN_ACCESS);
  assert.equal(interaction.calls.reply[0].flags, MessageFlags.Ephemeral);
  assert.deepEqual(interaction.calls.reply[0].allowedMentions, { parse: [] });
});

test('utilise editReply quand l\'interaction est déjà différée', async () => {
  const interaction = fakeInteraction({ roleNames: [], deferred: true });
  await requireAccess(interaction, ADMIN_ACCESS);
  assert.equal(interaction.calls.reply.length, 0);
  assert.equal(interaction.calls.editReply.length, 1);
});

test('énumération correcte pour trois rôles', async () => {
  const interaction = fakeInteraction({ roleNames: [] });
  await requireAccess(interaction, {
    roles: ['Administrateur', 'STAFF', 'Référant'],
    permission: null,
  });
  assert.match(interaction.calls.reply[0].content, /Réservé aux rôles Administrateur, STAFF et Référant\./);
});
