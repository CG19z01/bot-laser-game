// Sécurité : requireRole() est le point d'entrée du contrôle d'accès pour
// la quasi-totalité des commandes. Ce test vérifie qu'un membre non
// autorisé est bien bloqué (retour false + message de refus posté) et
// qu'un membre autorisé ne déclenche aucune réponse de refus.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MessageFlags } from 'discord.js';
import { requireRole } from '../../src/permissions/requireRole.js';
import { fakeInteraction } from '../../test-support/fakeDiscord.js';

test('autorise un membre avec le bon rôle et ne répond rien', async () => {
  const interaction = fakeInteraction({ roleNames: ['Administrateur'] });
  const allowed = await requireRole(interaction, ['Administrateur']);
  assert.equal(allowed, true);
  assert.equal(interaction.calls.reply.length, 0);
  assert.equal(interaction.calls.editReply.length, 0);
});

test('refuse un membre sans le bon rôle, interaction non différée -> reply() éphémère', async () => {
  const interaction = fakeInteraction({ roleNames: ['Membre'], deferred: false });
  const allowed = await requireRole(interaction, ['Administrateur', 'STAFF']);
  assert.equal(allowed, false);
  assert.equal(interaction.calls.editReply.length, 0);
  assert.deepEqual(interaction.calls.reply, [
    { content: 'Réservé aux rôles Administrateur et STAFF.', flags: MessageFlags.Ephemeral },
  ]);
});

test('refuse un membre sans le bon rôle, interaction différée -> editReply()', async () => {
  const interaction = fakeInteraction({ roleNames: [], deferred: true });
  const allowed = await requireRole(interaction, ['Administrateur']);
  assert.equal(allowed, false);
  assert.equal(interaction.calls.reply.length, 0);
  assert.deepEqual(interaction.calls.editReply, [{ content: 'Réservé au rôle Administrateur.' }]);
});

test('message de refus correct pour 3 rôles', async () => {
  const interaction = fakeInteraction({ roleNames: [] });
  await requireRole(interaction, ['Administrateur', 'STAFF', 'Référant']);
  assert.equal(interaction.calls.reply[0].content, 'Réservé aux rôles Administrateur, STAFF et Référant.');
});
