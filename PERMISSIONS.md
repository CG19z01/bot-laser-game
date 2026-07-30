# Permissions des commandes - Bot Laser Game

| Commande              | Restriction (visibilité) | Restriction code (rôle) | Rôles à ajouter manuellement dans Discord |
|-----------------------|--------------------------|-------------------------|-------------------------------------------|
| `/autorole add`       | Masquée par défaut (0n)  | Admin                   | Admin                                     |
| `/antispam limit`     | Masquée par défaut (0n)  | Admin, STAFF            | Admin, STAFF                              |
| `/mute`               | Masquée par défaut (0n)  | Admin, STAFF            | Admin, STAFF                              |
| `/delete`             | Masquée par défaut (0n)  | Admin, STAFF            | Admin, STAFF                              |
| `/perm`               | Masquée par défaut (0n)  | Admin                   | Admin                                     |
| `/nouvelle-promo`     | Masquée par défaut (0n)  | Admin                   | Admin                                     |
| `/copier-permissions` | Masquée par défaut (0n)  | Admin                   | Admin                                     |
| `/equipes`            | Masquée par défaut (0n)  | Admin, STAFF, Référant  | Admin, STAFF, Référant                    |
| `/sondage`            | Masquée par défaut (0n)  | Admin, STAFF, Référant  | Admin, STAFF, Référant                    |
| `/edit-score`         | Masquée par défaut (0n)  | Admin, STAFF, Référant  | Admin, STAFF, Référant                    |
| `/score`              | (aucune)                 | (aucune)                | (aucune)                                  |
| `/aide`               | (aucune)                 | (aucune)                | (aucune)                                  |
| `/deco`               | Masquée par défaut (0n)  | Admin                   | Admin                                     |

## A faire cote Discord

Toutes les commandes (sauf /score et /aide) sont masquees par defaut
(0n) : seuls les vrais **Administrateurs Discord** les voient tant que
les roles listes en derniere colonne ne sont pas ajoutes manuellement,
dans le serveur Discord :

**Parametres du serveur -> Integrations -> Bot Laser Game -> [commande]**
-> ajouter les roles listes dans la derniere colonne.

Ceci ne remplace pas la verification faite par le bot (nom de role exact) -
c est une couche en plus qui masque la commande dans le client Discord pour
qui n a pas le role.

## Source de verite en code

`src/permissions/commandRoles.js` doit etre tenu a jour en meme temps
que ce tableau (utilise par /aide pour filtrer les commandes visibles).
