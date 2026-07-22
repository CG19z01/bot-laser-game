# Bot Laser Game

Bot Discord pour la gestion du Laser Game.

## État du projet

Fonctionnalités disponibles : **auto-role** (attribution automatique d'un
rôle aux nouveaux membres) et **anti-spam** (limite de messages par
utilisateur avec suppression et/ou timeout configurables).

## Structure du projet

```
src/
├── index.js               entrypoint
├── deployCommands.js      enregistrement des slash commands
├── config/env.js          lecture des variables d'environnement
├── db/                    accès SQLite (connexion, schéma, autorole/, antispam/)
├── antispam/              suivi en mémoire des messages (fenêtre glissante)
├── commands/              commandes /autorole et /antispam
├── events/                ready, interactionCreate, guildMemberAdd, messageCreate
└── utils/                 chargement dynamique des commands/events
```

## Prérequis

- Node.js 20.x ou 22.x+ (`better-sqlite3` ne supporte pas les versions
  intermédiaires hors 20.x/22.x — voir `package.json`)
- Une application Discord (discord.com/developers/applications) avec un bot
  et l'intent privilégié **Server Members Intent** activé.
- Permissions du bot sur le serveur : **Gérer les rôles** (auto-role),
  **Gérer les messages** et **Mute les membres (timeout)** (anti-spam, si
  l'action `mute` est utilisée).

## Installation

1. `npm install`
2. `cp .env.example .env` puis renseigner `DISCORD_TOKEN`, `CLIENT_ID`, `GUILD_ID`
3. `npm run deploy-commands`
4. `npm start`

## Variables d'environnement

| Variable | Description |
|---|---|
| `DISCORD_TOKEN` | Token du bot (Developer Portal > Bot) |
| `CLIENT_ID` | Application ID |
| `GUILD_ID` | ID du serveur Discord de développement |

## Commandes disponibles

- `/autorole set <role>` — définit le rôle attribué automatiquement aux
  nouveaux membres. Nécessite la permission "Gérer les rôles".
- `/antispam set-limit <messages> <window>` — définit le seuil de
  déclenchement (nombre de messages sur une fenêtre en secondes, par
  serveur+salon+utilisateur). Par défaut : 5 messages / 5s.
- `/antispam action delete` — en cas de dépassement, supprime uniquement
  les messages en trop.
- `/antispam action mute <duration>` — en cas de dépassement, supprime les
  messages en trop et met l'utilisateur en timeout pour `duration` secondes.

Ces deux dernières commandes nécessitent la permission "Modérer les membres".

## Conventions

Voir [CLAUDE.md](./CLAUDE.md) pour les conventions de code (taille des
fichiers, une fonction par fichier, mise à jour du README après chaque
commit).
