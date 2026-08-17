// Rôles autorisés par commande (nom sans le "/"), utilisé par /aide pour
// n'afficher à un membre que les commandes qu'il peut réellement utiliser.
// `null` = commande ouverte à tout le monde. Doit rester synchronisé avec
// la vérification hasRoleNamed() réelle de chaque commande (voir aussi
// PERMISSIONS.md — CLAUDE.md impose de mettre à jour les deux ensemble).
export const COMMAND_ROLES = {
  autorole: ['Administrateur'],
  antispam: ['Administrateur', 'STAFF'],
  mute: ['Administrateur', 'STAFF'],
  delete: ['Administrateur', 'STAFF'],
  'copie-cat': ['Administrateur'],
  'nouvelle-promo': ['Administrateur'],
  'copie-perm': ['Administrateur'],
  equipe: ['Administrateur', 'STAFF', 'Référant'],
  sondage: ['Administrateur', 'STAFF', 'Référant'],
  'edit-score': ['Administrateur', 'STAFF', 'Référant'],
  score: null,
  'mon-pseudo': null,
  stats: null,
  aide: null,
  deco: ['Administrateur'],
};
