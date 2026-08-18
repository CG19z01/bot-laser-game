# Permissions des commandes - Bot Laser Game

Deux conditions cumulatives pour les commandes restreintes : porter le
rôle nommé **et** détenir la permission Discord indiquée. Le nom exprime
l'organisation de la communauté, la permission atteste du pouvoir réel —
sans elle, un rôle purement décoratif nommé « Administrateur » suffisait
à arrêter le bot ou à redistribuer des permissions.

| Commande          | Rôle requis            | Permission Discord requise | Visibilité client |
|-------------------|------------------------|----------------------------|-------------------|
| `/autorole add`   | Admin                  | Gérer les rôles            | Masquée (0n)      |
| `/antispam limit` | Admin, STAFF           | Modérer les membres        | Masquée (0n)      |
| `/mute`           | Admin, STAFF           | Modérer les membres        | Masquée (0n)      |
| `/delete`         | Admin, STAFF           | Modérer les membres        | Masquée (0n)      |
| `/copie-cat`      | Admin                  | Gérer les salons           | Masquée (0n)      |
| `/nouvelle-promo` | Admin                  | Gérer les salons           | Masquée (0n)      |
| `/copie-perm`     | Admin                  | Administrateur             | Masquée (0n)      |
| `/deco`           | Admin                  | Administrateur             | Masquée (0n)      |
| `/equipe`         | Admin, STAFF, Référant | (aucune)                   | Masquée (0n)      |
| `/sondage`        | Admin, STAFF, Référant | (aucune)                   | Masquée (0n)      |
| `/edit-score`     | Admin, STAFF, Référant | (aucune)                   | Masquée (0n)      |
| `/delete-score`   | Admin, STAFF, Référant | (aucune)                   | Masquée (0n)      |
| `/score`          | (aucun)                | (aucune)                   | Visible           |
| `/mon-pseudo`     | (aucun)                | (aucune)                   | Visible           |
| `/stats`          | (aucun)                | (aucune)                   | Visible           |
| `/aide`           | (aucun)                | (aucune)                   | Visible           |

## A faire cote Discord

Le role **Administrateur** ne porte aujourd hui aucune permission Discord :
les huit commandes ci-dessus qui en exigent une lui sont donc refusees.
Pour lui rendre ses acces, dans **Parametres du serveur -> Roles ->
Administrateur**, cocher au minimum :

| Pour debloquer                      | Cocher                |
|-------------------------------------|-----------------------|
| /copie-perm et /deco                | Administrateur        |
| /autorole                           | Gerer les roles       |
| /copie-cat et /nouvelle-promo       | Gerer les salons      |
| /antispam, /mute, /delete           | Moderer les membres   |

Cocher **Administrateur** couvre tout le reste. Le role STAFF possede
deja Gerer les roles, Gerer les salons et Moderer les membres : il passe
donc /antispam, /mute et /delete sans changement.

Les commandes restreintes sont par ailleurs masquees dans le client
(setDefaultMemberPermissions(0n)) : pour qu un membre les voie, il faut
aussi les lui ouvrir dans **Parametres du serveur -> Integrations ->
Bot Laser Game**. Ce masquage ne remplace pas le controle ci-dessus, il
s ajoute a lui.

## Cooldown /score

Delai entre deux scans, plus court selon le role
(`SCORE_COOLDOWNS` dans `src/config/scoreConfig.js`) : aucun pour
Administrateur et STAFF, 10 s pour Referant, 60 s pour tout le monde. Un
membre cumulant plusieurs roles beneficie du delai le plus court. Le
delai est rendu si l appel s arrete avant l OCR. En complement, un seul
OCR tourne a la fois pour tout le bot (`src/score/withOcrLock.js`).

## Source de verite en code

`src/permissions/commandAccess.js` doit etre tenu a jour en meme temps
que ce tableau. Deux tests le verifient : la synchronisation avec les
commandes reellement chargees, et le fait qu un role sans la permission
exigee est bien refuse.
