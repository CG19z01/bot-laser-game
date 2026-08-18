// Vérifie les conditions d'accès et répond directement en cas de refus —
// utilise editReply si l'interaction a déjà été différée, reply sinon.
// Retourne true si autorisé ; l'appelant doit `return` immédiatement si false.

import { MessageFlags } from 'discord.js';
import { hasAccess } from './hasAccess.js';
import { PERMISSION_LABELS } from './commandAccess.js';

function listRoles(roles) {
  if (roles.length === 1) return `au rôle ${roles[0]}`;
  return `aux rôles ${roles.slice(0, -1).join(', ')} et ${roles[roles.length - 1]}`;
}

function deniedMessage(access, reason) {
  if (reason === 'role') return `Réservé ${listRoles(access.roles)}.`;

  const label = PERMISSION_LABELS.get(access.permission) ?? 'requise';
  return (
    `Ton rôle convient, mais la permission Discord « ${label} » lui manque. ` +
    'Un administrateur du serveur doit la lui accorder dans ' +
    'Paramètres du serveur → Rôles.'
  );
}

export async function requireAccess(interaction, access) {
  const { allowed, reason } = hasAccess(interaction.member, access);
  if (allowed) return true;

  const content = deniedMessage(access, reason);
  if (interaction.deferred) {
    await interaction.editReply({ content, allowedMentions: { parse: [] } });
  } else {
    await interaction.reply({
      content,
      flags: MessageFlags.Ephemeral,
      allowedMentions: { parse: [] },
    });
  }
  return false;
}
