# Bot Laser Game

Bot Discord pour la gestion du Laser Game.

## État du projet

Fonctionnalités disponibles : **auto-role par réaction** (plusieurs rôles
possibles, un émoji différent par rôle sur un même message ; un membre
obtient le rôle associé en réagissant, le perd en retirant sa réaction —
évite l'attribution automatique à des comptes bots qui rejoignent),
**anti-spam** (limite de messages par utilisateur avec suppression et/ou
timeout configurables), **sondages** (choix d'une date parmi plusieurs
propositions par réactions) et **équipes aléatoires** (répartition au
hasard d'une liste de joueurs).

## Structure du projet

```
src/
├── index.js               entrypoint
├── deployCommands.js      enregistrement des slash commands
├── config/env.js          lecture des variables d'environnement
├── db/                    accès SQLite (connexion, schéma, autorole/, antispam/, polls/)
├── antispam/              suivi en mémoire des messages (fenêtre glissante)
├── autorole/              normalisation des émojis pour le rôle par réaction
├── polls/                 émojis utilisés pour le vote par date
├── logs/                  envoi des messages de log vers LOG_CHANNEL_ID
├── permissions/           vérification de rôle par nom (STAFF, Référant...)
├── commands/              commandes /autorole, /antispam, /delete, /mute,
│                          /sondage, /equipes, /dupliquer,
│                          /copier-permissions
├── events/                ready, interactionCreate, messageCreate,
│                          pollReactionAdd, autoroleReactionAdd,
│                          autoroleReactionRemove
└── utils/                 chargement dynamique des commands/events
```

## Prérequis

- Node.js 20.x ou 22.x+ (`better-sqlite3` ne supporte pas les versions
  intermédiaires hors 20.x/22.x — voir `package.json`)
- Une application Discord (discord.com/developers/applications) avec un bot
  et l'intent privilégié **Server Members Intent** activé.
- Permissions du bot sur le serveur : **Gérer les rôles** (auto-role),
  **Gérer les messages** et **Mute les membres (timeout)** (anti-spam, si
  l'action `mute` est utilisée), **Ajouter des réactions** (sondages),
  **Gérer les salons** (`/dupliquer`).
- Un salon admin où le bot peut poster (confirmation de clôture des
  sondages) — son ID sera renseigné dans `ADMIN_CHANNEL_ID`.
- Un salon dédié où le bot poste le message de rôle par réaction — son ID
  sera renseigné dans `ROLE_CHANNEL_ID`.
- Un salon de logs (ex: `#logs`) où le bot poste son journal d'activité —
  son ID sera renseigné dans `LOG_CHANNEL_ID`.

## Installation

1. `npm install`
2. `cp .env.example .env` puis renseigner `DISCORD_TOKEN`, `CLIENT_ID`,
   `GUILD_ID`, `ADMIN_CHANNEL_ID`, `ROLE_CHANNEL_ID`, `LOG_CHANNEL_ID`
3. `npm run deploy-commands`
4. `npm start`

## Variables d'environnement

| Variable | Description |
|---|---|
| `DISCORD_TOKEN` | Token du bot (Developer Portal > Bot) |
| `CLIENT_ID` | Application ID |
| `GUILD_ID` | ID du serveur Discord de développement |
| `ADMIN_CHANNEL_ID` | ID du salon où sont postées les confirmations de clôture de sondage |
| `ROLE_CHANNEL_ID` | ID du salon où est posté le message de rôle par réaction |
| `LOG_CHANNEL_ID` | ID du salon où est posté le journal d'activité du bot |

## Journal d'activité (logs)

Le bot poste dans `LOG_CHANNEL_ID` : connexion/déconnexion du bot,
erreurs de commande, attribution/retrait de rôle par réaction,
modification de `/autorole add`, timeout anti-spam, purge manuelle via
`/delete`, création et clôture de sondage, génération d'équipes,
duplication de catégorie, et tentative de `/dupliquer` sans le rôle
requis.

## Commandes disponibles

- `/autorole add <role> <emoji>` — associe `emoji` à `role` sur le message
  de réaction dans `ROLE_CHANNEL_ID` (créé au premier appel, mis à jour
  ensuite pour ajouter une ligne). Réagir avec `emoji` donne `role`,
  retirer la réaction le retire. Rappeler la commande avec un émoji déjà
  utilisé remplace le rôle associé. Pensé pour être appelé une fois par
  rôle (ex: une fois par promo) sans jamais nécessiter de changement de
  code quand de nouveaux rôles s'ajoutent. Nécessite la permission "Gérer
  les rôles" ; refuse un rôle disposant de la permission Administrateur.
- `/antispam set-limit <messages> <seconde>` — définit le seuil de
  déclenchement (nombre de messages sur une fenêtre en secondes, par
  serveur+salon+utilisateur). Par défaut : 5 messages / 5s.
- `/mute <duration>` — en cas de dépassement du seuil anti-spam, l'action
  devient : suppression des messages en trop + timeout de `duration`
  secondes pour l'utilisateur.
- `/delete [user] [nombre]` — comportement à double usage :
  - sans aucun paramètre : configure l'action anti-spam sur « suppression
    uniquement » (pas de timeout) en cas de dépassement du seuil ;
  - avec `user` et/ou `nombre` : purge manuellement des messages du salon
    courant (jusqu'à `nombre`, 10 par défaut si `user` est fourni seul ;
    tous auteurs confondus si `user` est omis).

Ces trois commandes nécessitent la permission "Modérer les membres".

- `/sondage create <lieu> <ville> <dates> <nombre_personnes> <seuil>` —
  crée un sondage pour une session avec 1 à 10 dates au format
  `JJ/MM/AAAA` séparées par des points-virgules (`;`). Chaque date reçoit
  une réaction emoji numérotée. Dès que le total des réactions (toutes
  dates confondues) atteint `seuil`, le sondage se clôture automatiquement :
  le message est édité pour afficher la date ayant reçu le plus de
  réactions, et une confirmation est postée dans le salon
  `ADMIN_CHANNEL_ID`. Réservée aux rôles **Administrateur**, **STAFF**
  et **Référant**.

- `/equipes <equipes> <nombre> <users>` — répartit aléatoirement les noms
  fournis dans `users` (séparés par des virgules) en `equipes` équipes de
  taille équilibrée. `nombre` doit correspondre exactement au nombre de
  noms trouvés dans `users` (sert de vérification anti-erreur de saisie) ;
  entre 6 et 40 joueurs. Réservée aux rôles **Administrateur**, **STAFF**
  et **Référant**.

- `/dupliquer <categorie> <nom> [roles]` — duplique la catégorie choisie
  sous le nom `nom`, ainsi que tous les salons qu'elle contient (pas les
  messages). Les permissions ne sont **pas** copiées depuis la source :
  la nouvelle catégorie et ses salons sont configurés en privé — refusés
  à `@everyone`, autorisés (voir, écrire, poster images/émojis externes)
  uniquement pour **Administrateur**, **STAFF**, et les rôles listés dans
  `roles` (noms exacts séparés par `;`, ex: `P1 2026`). La commande
  échoue si l'un des rôles nommés n'existe pas. Réservée aux membres
  ayant le rôle **Administrateur** ou **STAFF** (vérifié par nom de
  rôle, en plus de la permission Discord "Gérer les salons" qui
  contrôle la visibilité de la commande). Le bot doit lui-même avoir la
  permission "Gérer les salons" sur le serveur.

- `/copier-permissions <source> <cibles> [salon] [salons_cibles]` —
  copie les autorisations du rôle `source` vers chaque rôle listé dans
  `cibles` (noms ou mentions `@rôle`, séparés par `;`). Sans `salon` :
  copie les autorisations globales du serveur (remplace entièrement
  celles des rôles cibles, pas une fusion). Avec `salon` : copie
  uniquement la permission spécifique de `source` sur ce salon (refuse
  si `source` n'en a pas) ; par défaut appliquée aux rôles cibles sur ce
  même salon, ou sur chaque salon listé dans `salons_cibles` (noms ou
  mentions `#salon`, séparés par `;`) si fourni — permet de copier vers
  plusieurs salons en un seul appel. `cibles` et `salons_cibles`
  acceptent aussi bien un nom exact qu'une mention Discord ; toute
  entrée non reconnue est listée dans le message d'erreur (pratique pour
  repérer un `;` oublié). Refuse si `source` a la permission
  Administrateur, ou si `salons_cibles` est fourni sans `salon`.
  ⚠️ **Remplacement exact, pas une fusion** : sur le(s) salon(s) ciblé(s),
  toute permission qu'un rôle cible avait déjà et que `source` n'a pas
  est effacée (remplacée par l'état de `source`, qui peut être plus
  restreint). Vérifier les permissions existantes des rôles cibles sur
  ce salon avant de lancer la commande si elles diffèrent volontairement
  de `source`.
  Réservée au rôle **Administrateur**.

## Conventions

Voir [CLAUDE.md](./CLAUDE.md) pour les conventions de code (taille des
fichiers, une fonction par fichier, mise à jour du README après chaque
commit).
