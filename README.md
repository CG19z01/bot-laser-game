# Bot Laser Game

Bot Discord pour la gestion du Laser Game.

## État du projet

Fonctionnalités disponibles : **auto-role par réaction** (plusieurs rôles
possibles, un émoji différent par rôle sur un même message ; un membre
obtient le rôle associé en réagissant, le perd en retirant sa réaction —
évite l'attribution automatique à des comptes bots qui rejoignent),
**anti-spam** (limite de messages par utilisateur avec suppression et/ou
timeout configurables), **sondages** (choix d'une date parmi plusieurs
propositions par réactions), **équipes aléatoires** (répartition au
hasard d'une liste de joueurs), **extraction de scores** (lecture d'une
photo de feuille de résultats par OCR local, avec vérification automatique
et correction possible par un Référant), **statistiques joueur** (cumul des
coups reçus et donnés par zone au fil des parties), **aide** (liste des
commandes accessibles selon le rôle) et **déconnexion manuelle** du bot par
un Administrateur.

## Structure du projet

```
src/
├── index.js               entrypoint
├── deployCommands.js      enregistrement des slash commands
├── config/env.js          lecture des variables d'environnement
├── db/                    accès SQLite (connexion, schéma, migrations,
│                          autorole/, antispam/, polls/, scores/, pseudos/)
├── antispam/              suivi en mémoire des messages (fenêtre glissante)
├── autorole/              normalisation des émojis pour le rôle par réaction
├── polls/                 émojis utilisés pour le vote par date
├── logs/                  envoi des messages de log vers LOG_CHANNEL_ID
├── permissions/           vérification de rôle par nom (STAFF, Référant...)
│                          et rôles autorisés par commande (commandRoles.js,
│                          utilisé par /aide)
├── score/                 pipeline d'extraction /score : recadrage,
│                          redressement, détection du quadrillage, OCR
│                          cellule par cellule (Tesseract.js)
├── commands/              commandes /autorole, /antispam, /delete, /mute,
│                          /sondage, /equipe, /copie-cat, /nouvelle-promo,
│                          /copie-perm, /score, /edit-score,
│                          /mon-pseudo, /stats, /aide, /deco
├── events/                ready, interactionCreate, messageCreate,
│                          pollReactionAdd, autoroleReactionAdd,
│                          autoroleReactionRemove
└── utils/                 chargement dynamique des commands/events

test/                      tests unitaires (node --test), même arborescence que src/
test-support/              mocks discord.js partagés entre fichiers de test
```

## Prérequis

- Node.js 20.x ou 22.x+ (`better-sqlite3` ne supporte pas les versions
  intermédiaires hors 20.x/22.x — voir `package.json`)
- Une application Discord (discord.com/developers/applications) avec un bot
  et l'intent privilégié **Server Members Intent** activé.
- Permissions du bot sur le serveur : **Gérer les rôles** (auto-role),
  **Gérer les messages** et **Mute les membres (timeout)** (anti-spam, si
  l'action `mute` est utilisée), **Ajouter des réactions** (sondages),
  **Gérer les salons** (`/copie-cat`, `/nouvelle-promo`).
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

## Tests

`npm test` (test runner intégré de Node, `node --test`, zéro dépendance
supplémentaire). Les fichiers `*.test.js` sous `test/` couvrent les
fonctions pures et isolées (permissions, validation, parsing, extraction
OCR) — pas les commandes complètes (dépendance forte à l'API discord.js,
non mockée). Certains helpers privés (`shuffle`/`buildTeams`,
`parseDates`, `buildOverwrites`) sont exportés en plus de l'export par
défaut de leur commande uniquement pour être testables. `test-support/fakeDiscord.js` fournit des mocks
discord.js minimalistes réutilisés entre plusieurs fichiers de test.

Les tests touchant la base (`test/db/`) tournent sur un fichier SQLite
temporaire (`BOT_DB_PATH`, voir `src/db/database.js`) — **jamais** sur
`data/bot.db`.

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
duplication de catégorie, tentative de `/copie-cat` sans le rôle requis,
et correction d'un score via `/edit-score`.

## Commandes disponibles

- `/autorole add <role> <emoji>` — associe `emoji` à `role` sur le message
  de réaction dans `ROLE_CHANNEL_ID` (créé au premier appel, mis à jour
  ensuite pour ajouter une ligne). Réagir avec `emoji` donne `role`,
  retirer la réaction le retire. Rappeler la commande avec un émoji déjà
  utilisé remplace le rôle associé. Pensé pour être appelé une fois par
  rôle (ex: une fois par promo) sans jamais nécessiter de changement de
  code quand de nouveaux rôles s'ajoutent. Réservée au rôle
  **Administrateur** ; refuse de proposer un rôle disposant lui-même de la
  permission Administrateur.
- `/antispam limit <messages> <seconde>` — définit le seuil de
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

Ces trois commandes sont réservées aux rôles **Administrateur** et **STAFF**.

- `/sondage create <evenement> <ville> <dates> <nombre_personnes> <seuil>` —
  crée un sondage pour une session avec 1 à 10 dates au format
  `JJ/MM/AAAA` séparées par des points-virgules (`;`). Chaque date reçoit
  une réaction emoji numérotée. Dès que le total des réactions (toutes
  dates confondues) atteint `seuil`, le sondage se clôture automatiquement :
  le message est édité pour afficher la date ayant reçu le plus de
  réactions, et une confirmation est postée dans le salon
  `ADMIN_CHANNEL_ID`. Réservée aux rôles **Administrateur**, **STAFF**
  et **Référant**.

- `/equipe <equipes> <nombre> <users>` — répartit aléatoirement les noms
  fournis dans `users` (séparés par des virgules) en `equipes` équipes de
  taille équilibrée. `nombre` doit correspondre exactement au nombre de
  noms trouvés dans `users` (sert de vérification anti-erreur de saisie) ;
  entre 6 et 40 joueurs. Réservée aux rôles **Administrateur**, **STAFF**
  et **Référant**.

- `/copie-cat <categorie> <nom> [roles]` — duplique la catégorie choisie
  sous le nom `nom`, ainsi que tous les salons qu'elle contient (pas les
  messages). Les permissions ne sont **pas** copiées depuis la source :
  la nouvelle catégorie et ses salons sont configurés en privé — refusés
  à `@everyone`, autorisés (voir, écrire, poster images/émojis externes)
  uniquement pour **Administrateur**, et les rôles listés dans
  `roles` (noms exacts séparés par `;`, ex: `P1 2026`). La commande
  échoue si l'un des rôles nommés n'existe pas. Réservée au rôle
  **Administrateur**. Le bot doit lui-même avoir la permission "Gérer les
  salons" sur le serveur.

- `/nouvelle-promo <categorie> <nom> <role_source> <role_cible>` —
  duplique une catégorie de promo comme `/copie-cat`, mais **copie fidèlement**
  les permissions existantes de chaque salon source (STAFF, Référant, etc.
  inclus, sans modification) et substitue uniquement `role_source` par
  `role_cible` dans ces permissions. `role_cible` (le rôle de la nouvelle
  promo) doit déjà exister — la commande ne crée pas de rôle. Réservée au
  rôle **Administrateur**. Le bot doit avoir la permission "Gérer les
  salons" sur le serveur.

- `/copie-perm <source> <cibles> [salon] [salons_cibles]` —
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

- `/score <image> [pseudo] [joueur]` — extrait les résultats d'une photo de feuille de
  résultats Laser Game Evolution envoyée en pièce jointe (`.jpg`, `.jpeg`,
  `.png`, `.webp`, `.heic`, `.heif`), par **OCR local** (Tesseract.js —
  gratuit, aucun appel externe). Le pipeline (`src/score/`) enchaîne :
  détection de la feuille sur le fond (`cropToSheet`), redressement de
  l'inclinaison (`deskewSheet`), détection du quadrillage
  (`detectGrid`), puis lecture **cellule par cellule** avec un seuil de
  binarisation calculé pour chaque case (`otsuThreshold`,
  `readCellDigits`). Sont lus : le pseudo en haut de feuille, l'`Eff. Tir`
  et le `Score` sur la ligne du joueur, et les colonnes `Av`/`Ar`/`Ep`/`Pi`
  des tableaux « reçus » et « donnés », sommées sur les lignes adverses.

  Le **pseudo est saisi, pas deviné** : l'option `pseudo` (ou, à défaut,
  celui enregistré via `/mon-pseudo`) sert à retrouver la ligne du joueur
  dans le tableau de gauche. Reconnaître un nom propre par OCR est bien
  moins fiable que reconnaître un chiffre, et une erreur rattacherait la
  partie au mauvais joueur. Si le pseudo n'est pas trouvé sur la feuille,
  la commande refuse au lieu d'enregistrer n'importe quoi. L'option
  `joueur` permet à un Référant de scanner la feuille de quelqu'un d'autre.

  **Doublons** : une feuille déjà scannée n'est pas comptée deux fois. Le
  bot compare les totaux imprimés en en-tête, le score et l'Eff. Tir de la
  partie à celles déjà enregistrées pour ce joueur. Ces valeurs-là sont
  choisies parce qu'elles se lisent de façon fiable ; les chiffres cellule
  par cellule sont volontairement exclus de cette comparaison, l'OCR
  pouvant en rater un et laisser passer le doublon. La date et le numéro de
  partie auraient été une clé plus directe, mais leur impression est trop
  petite pour être lue, même à pleine résolution.

  **Vérification automatique** : les totaux calculés sont comparés à ceux
  imprimés en en-tête de la feuille (« 26 Reçues Joueur(s) », « 39
  Données »). En cas d'écart, l'embed passe en orange et signale les
  chiffres douteux — ils ne sont **jamais** recalculés à partir du total,
  une case illisible reste visible comme telle et se corrige avec
  `/edit-score`. Mesuré sur la feuille de référence : 47 cellules
  correctes sur 48, l'unique erreur étant bien signalée par ce contrôle.

  Ouverte à tous les membres, avec deux garde-fous (l'OCR est coûteux en
  RAM/CPU et le bot est mono-thread) :
  - **cooldown par utilisateur, modulé par le rôle** — Administrateur et
    STAFF sans limite, Référant 10s, tout le monde 60s (voir
    `SCORE_COOLDOWNS` dans `src/config/scoreConfig.js` ; un membre cumulant
    plusieurs rôles bénéficie du délai le plus court) ;
  - **un seul OCR à la fois pour tout le bot**
    (`src/score/withOcrLock.js`) — les appels simultanés reçoivent un
    message leur demandant de réessayer, ce qui évite que plusieurs
    workers Tesseract lancés par des membres différents saturent la
    mémoire.

- `/edit-score <id> <champ> <valeur>` — corrige une valeur d'un score
  après comparaison visuelle entre la photo et le résultat affiché par
  `/score` (l'`id` figure dans le pied de page de l'embed). `champ` est un
  des 8 champs proposés en liste déroulante (reçus/donnés × Av/Ar/Ep/Pi).
  Réservée aux rôles
  **Administrateur**, **STAFF** et **Référant** ; chaque correction est
  postée dans `LOG_CHANNEL_ID`.

- `/mon-pseudo <pseudo>` — enregistre ton pseudo laser game (celui imprimé
  en haut de ta feuille) pour ne plus avoir à le retaper à chaque `/score`,
  et pour qu'il serve de libellé dans `/stats`. Ouverte à tous, réponse
  éphémère.

- `/stats [membre]` — affiche le cumul des coups reçus et donnés, zone par
  zone, sur toutes les parties enregistrées via `/score`. Sans argument,
  affiche les tiennes ; avec `membre`, celles de quelqu'un d'autre. Le
  regroupement se fait sur le **compte Discord**, pas sur le pseudo : un
  joueur qui change de nom d'une session à l'autre garde un historique
  unique. Ouverte à tous.

- `/aide` — liste, en réponse éphémère, les commandes que l'utilisateur qui
  l'invoque peut effectivement utiliser (filtrage par rôle via
  `src/permissions/commandRoles.js`). Ouverte à tous.

- `/deco` — arrête le process du bot (`process.exit`), pas seulement la
  connexion Discord. Réservée au rôle **Administrateur** ; l'arrêt est
  posté dans `LOG_CHANNEL_ID`. ⚠️ Aucun redémarrage automatique : il faut
  relancer `npm start` manuellement ensuite.

## Permissions

Toutes les commandes (sauf `/score` et `/aide`) sont masquées par défaut dans le
client Discord (`setDefaultMemberPermissions(0n)`) — le contrôle réel se
fait par nom de rôle dans le code. Pour que STAFF/Référant les voient dans
Discord, il faut aussi les ajouter manuellement par commande dans
**Paramètres du serveur → Intégrations → Bot Laser Game**. Détail par
commande dans [PERMISSIONS.md](./PERMISSIONS.md).

## Conventions

Voir [CLAUDE.md](./CLAUDE.md) pour les conventions de code (taille des
fichiers, une fonction par fichier, mise à jour du README après chaque
commit).

## Licence

[MIT](./LICENSE)
