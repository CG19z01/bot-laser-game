# Bot Laser Game

Bot Discord pour la gestion du Laser Game.

## État du projet

Fonctionnalités disponibles : **auto-role** (attribution automatique d'un
rôle aux nouveaux membres), **anti-spam** (limite de messages par
utilisateur avec suppression et/ou timeout configurables), **sondages**
(choix d'une date parmi plusieurs propositions par réactions) et
**équipes aléatoires** (répartition au hasard d'une liste de joueurs).

## Structure du projet

```
src/
├── index.js               entrypoint
├── deployCommands.js      enregistrement des slash commands
├── config/env.js          lecture des variables d'environnement
├── db/                    accès SQLite (connexion, schéma, autorole/, antispam/, polls/)
├── antispam/              suivi en mémoire des messages (fenêtre glissante)
├── polls/                 émojis utilisés pour le vote par date
├── commands/              commandes /autorole, /antispam, /delete, /mute,
│                          /sondage, /equipes
├── events/                ready, interactionCreate, guildMemberAdd,
│                          messageCreate, messageReactionAdd
└── utils/                 chargement dynamique des commands/events
```

## Prérequis

- Node.js 20.x ou 22.x+ (`better-sqlite3` ne supporte pas les versions
  intermédiaires hors 20.x/22.x — voir `package.json`)
- Une application Discord (discord.com/developers/applications) avec un bot
  et l'intent privilégié **Server Members Intent** activé.
- Permissions du bot sur le serveur : **Gérer les rôles** (auto-role),
  **Gérer les messages** et **Mute les membres (timeout)** (anti-spam, si
  l'action `mute` est utilisée), **Ajouter des réactions** (sondages).
- Un salon admin où le bot peut poster (confirmation de clôture des
  sondages) — son ID sera renseigné dans `ADMIN_CHANNEL_ID`.

## Installation

1. `npm install`
2. `cp .env.example .env` puis renseigner `DISCORD_TOKEN`, `CLIENT_ID`,
   `GUILD_ID`, `ADMIN_CHANNEL_ID`
3. `npm run deploy-commands`
4. `npm start`

## Variables d'environnement

| Variable | Description |
|---|---|
| `DISCORD_TOKEN` | Token du bot (Developer Portal > Bot) |
| `CLIENT_ID` | Application ID |
| `GUILD_ID` | ID du serveur Discord de développement |
| `ADMIN_CHANNEL_ID` | ID du salon où sont postées les confirmations de clôture de sondage |

## Commandes disponibles

- `/autorole set <role>` — définit le rôle attribué automatiquement aux
  nouveaux membres. Nécessite la permission "Gérer les rôles".
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
  `ADMIN_CHANNEL_ID`.

- `/equipes <equipes> <nombre> <users>` — répartit aléatoirement les noms
  fournis dans `users` (séparés par des virgules) en `equipes` équipes de
  taille équilibrée. `nombre` doit correspondre exactement au nombre de
  noms trouvés dans `users` (sert de vérification anti-erreur de saisie) ;
  entre 6 et 40 joueurs.

## Conventions

Voir [CLAUDE.md](./CLAUDE.md) pour les conventions de code (taille des
fichiers, une fonction par fichier, mise à jour du README après chaque
commit).
