# CLAUDE.md — Conventions du projet Bot Laser Game

Ce fichier définit les règles à suivre par tout agent Claude travaillant sur ce dépôt.

## Taille des fichiers

- Cible : ~100 lignes par fichier.
- Maximum absolu : 150 lignes.
- Si un fichier dépasse 150 lignes, le découper en modules plus petits (par
  responsabilité, pas arbitrairement) avant de continuer à y ajouter du code.

## Une fonction par fichier

- Un fichier = une fonction/composant exporté au maximum (helpers strictement
  privés et non réutilisables ailleurs tolérés dans le même fichier).
- Dès qu'une deuxième fonction publique apparaît dans un fichier, créer un
  nouveau fichier plutôt que d'empiler.
- Nommer le fichier d'après la fonction qu'il contient (ex: `sendScoreEmbed.js`
  contient uniquement `sendScoreEmbed`).

## Pas de duplication ni de verbosité

- Avant d'écrire une fonction, chercher dans le repo si une fonction
  équivalente existe déjà (`grep`/recherche) — réutiliser ou factoriser plutôt
  que copier-coller.
- Pas de fonctions "au cas où" : chaque fonction doit avoir un appelant réel.
- Pas de sur-abstraction : préférer du code direct et lisible à des couches
  génériques non nécessaires.
- Pas de code mort, pas d'implémentation à moitié faite.

## Commentaires

- Pas de commentaires par défaut.
- Un commentaire uniquement si le POURQUOI n'est pas évident (contrainte
  cachée, workaround, comportement surprenant de l'API Discord par exemple).

## Sécurité

- Pour toute fonctionnalité qui stocke ou manipule des « éléments à
  protéger » (tokens, IDs de rôles/salons sensibles, configuration
  d'administration, données personnelles), vérifier où et comment ils sont
  stockés (`.env` non commité, colonnes DB, variables en mémoire) et
  s'assurer qu'ils ne fuient jamais dans un log, un message Discord ou un
  commit.
- Pour toute commande donnant accès à une action sensible (modération,
  configuration du bot, suppression de messages, attribution de rôles,
  gestion des membres), vérifier que la permission Discord requise est
  bien posée (`setDefaultMemberPermissions` ou équivalent) — ne jamais
  laisser une commande à fort impact accessible à `@everyone` par défaut
  sans que ce soit un choix délibéré.
- Vérifier qu'aucun texte libre fourni par un utilisateur n'est renvoyé
  dans un message public sans `allowedMentions` restreint (risque de ping
  `@everyone`/rôle non désiré).
- Après toute modification touchant permissions, stockage de secrets ou
  entrées utilisateur affichées publiquement, faire une relecture
  sécurité ciblée avant de committer.

## Git & documentation

- **Après chaque commit**, mettre à jour `README.md` pour qu'il reflète l'état
  réel du projet : structure des fichiers, commandes du bot disponibles,
  variables d'environnement, étapes d'installation/lancement.
- Le README ne doit jamais décrire une fonctionnalité qui n'existe plus ou pas
  encore.
- Ne jamais committer de secrets (token Discord, clés API) — utiliser un
  `.env` listé dans `.gitignore`.
- Toute nouvelle commande (ou changement de restriction sur une commande
  existante) doit être ajoutée/mise à jour dans `PERMISSIONS.md` **et**
  dans `src/permissions/commandRoles.js` (source utilisée par `/aide`),
  avec la même logique que le README : ne jamais laisser ces fichiers
  décrire un état de permissions qui ne correspond plus au code.

## Avant de terminer une tâche

- Vérifier qu'aucun fichier ne dépasse 150 lignes.
- Vérifier qu'aucune fonction n'est dupliquée.
- Mettre à jour le README si la structure ou les commandes ont changé.
- Mettre à jour `PERMISSIONS.md` et `src/permissions/commandRoles.js` si
  une commande a été ajoutée ou si ses restrictions ont changé.
- Vérifier les points de la section Sécurité (stockage des éléments à
  protéger, permissions des commandes sensibles, mentions non protégées).
