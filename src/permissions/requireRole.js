import { MessageFlags } from 'discord.js';
import { hasRoleNamed } from './hasRoleNamed.js';

function buildDeniedMessage(roles) {
  if (roles.length === 1) return `Réservé au rôle ${roles[0]}.`;
  return `Réservé aux rôles ${roles.slice(0, -1).join(', ')} et ${roles[roles.length - 1]}.`;
}

// Vérifie le rôle et répond directement en cas de refus — utilise editReply
// si l'interaction a déjà été différée (deferReply), reply sinon. Retourne
// true si autorisé ; l'appelant doit `return` immédiatement si false.
export async function requireRole(interaction, roles) {
  if (hasRoleNamed(interaction.member, roles)) return true;

  const content = buildDeniedMessage(roles);
  if (interaction.deferred) {
    await interaction.editReply({ content });
  } else {
    await interaction.reply({ content, flags: MessageFlags.Ephemeral });
  }
  return false;
}
