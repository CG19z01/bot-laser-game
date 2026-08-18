// Décide si un membre remplit les conditions d'accès d'une commande, et
// dit précisément ce qui manque le cas échéant.
//
// Distinguer « mauvais rôle » de « bon rôle mais permission Discord
// absente » est essentiel en pratique : le second cas se règle en cochant
// une case dans les paramètres du serveur, et sans ce détail le refus est
// incompréhensible.

import { hasRoleNamed } from './hasRoleNamed.js';

export function hasAccess(member, access) {
  if (!access) return { allowed: true };

  if (!hasRoleNamed(member, access.roles)) {
    return { allowed: false, reason: 'role' };
  }

  if (access.permission && !member.permissions.has(access.permission)) {
    return { allowed: false, reason: 'permission' };
  }

  return { allowed: true };
}
