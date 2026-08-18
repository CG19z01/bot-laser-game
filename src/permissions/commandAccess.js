// Conditions d'accès par commande : un rôle nommé ET, pour les commandes à
// fort impact, une vraie permission Discord.
//
// Le contrôle par nom de rôle seul ne suffit pas : un rôle purement
// décoratif nommé « Administrateur », sans aucun pouvoir Discord, donnait
// accès à l'arrêt du bot et à la redistribution de permissions. Exiger en
// plus la permission correspondante ferme cette porte — le nom exprime
// l'organisation de la communauté, la permission atteste du pouvoir réel.
//
// `null` = commande ouverte à tous. `permission: null` = le nom de rôle
// suffit, car la commande ne touche que les données du bot et non le
// serveur (équipes, sondages, scores).
//
// Doit rester synchronisé avec PERMISSIONS.md (un test le vérifie).

import { PermissionFlagsBits } from 'discord.js';

const ADMIN = ['Administrateur'];
const ADMIN_STAFF = ['Administrateur', 'STAFF'];
const ADMIN_STAFF_REFERENT = ['Administrateur', 'STAFF', 'Référant'];

export const COMMAND_ACCESS = {
  autorole: { roles: ADMIN, permission: PermissionFlagsBits.ManageRoles },
  antispam: { roles: ADMIN_STAFF, permission: PermissionFlagsBits.ModerateMembers },
  mute: { roles: ADMIN_STAFF, permission: PermissionFlagsBits.ModerateMembers },
  delete: { roles: ADMIN_STAFF, permission: PermissionFlagsBits.ModerateMembers },
  'copie-cat': { roles: ADMIN, permission: PermissionFlagsBits.ManageChannels },
  'nouvelle-promo': { roles: ADMIN, permission: PermissionFlagsBits.ManageChannels },
  'copie-perm': { roles: ADMIN, permission: PermissionFlagsBits.Administrator },
  deco: { roles: ADMIN, permission: PermissionFlagsBits.Administrator },
  equipe: { roles: ADMIN_STAFF_REFERENT, permission: null },
  sondage: { roles: ADMIN_STAFF_REFERENT, permission: null },
  'edit-score': { roles: ADMIN_STAFF_REFERENT, permission: null },
  'delete-score': { roles: ADMIN_STAFF_REFERENT, permission: null },
  score: null,
  'mon-pseudo': null,
  stats: null,
  aide: null,
};

// Libellés tels qu'ils apparaissent dans l'interface Discord en français,
// pour que le message de refus indique exactement quoi cocher.
export const PERMISSION_LABELS = new Map([
  [PermissionFlagsBits.Administrator, 'Administrateur'],
  [PermissionFlagsBits.ManageRoles, 'Gérer les rôles'],
  [PermissionFlagsBits.ManageChannels, 'Gérer les salons'],
  [PermissionFlagsBits.ModerateMembers, 'Modérer les membres'],
]);
