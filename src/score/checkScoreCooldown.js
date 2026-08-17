// Cooldown par utilisateur sur /score, modulé par ses rôles. État gardé en
// mémoire (comme trackAndCheckSpam.js) : le perdre au redémarrage est sans
// conséquence, et ça évite une écriture SQLite par appel.
//
// Exception à la règle « une fonction exportée par fichier » : les deux
// fonctions manipulent la même table en mémoire, que les séparer obligerait
// à exposer dans un troisième module sans autre raison que la forme.

import { hasRoleNamed } from '../permissions/hasRoleNamed.js';
import { SCORE_COOLDOWNS, DEFAULT_SCORE_COOLDOWN_MS } from '../config/scoreConfig.js';

const lastUse = new Map();
const CLEANUP_INTERVAL_MS = 300_000;

setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of lastUse) {
    if (now - timestamp > CLEANUP_INTERVAL_MS) lastUse.delete(key);
  }
}, CLEANUP_INTERVAL_MS).unref();

const keyFor = (guildId, member) => `${guildId}:${member.id}`;

function cooldownMsFor(member) {
  const matching = SCORE_COOLDOWNS.filter((entry) => hasRoleNamed(member, entry.roles));
  if (matching.length === 0) return DEFAULT_SCORE_COOLDOWN_MS;
  // Le rôle le plus permissif gagne quand un membre en cumule plusieurs.
  return Math.min(...matching.map((entry) => entry.cooldownMs));
}

// Retourne 0 si l'appel est autorisé (et enregistre son horodatage), sinon
// le nombre de secondes restantes à attendre.
export function checkScoreCooldown(guildId, member) {
  const cooldownMs = cooldownMsFor(member);
  if (cooldownMs === 0) return 0;

  const key = keyFor(guildId, member);
  const now = Date.now();
  const previous = lastUse.get(key);

  if (previous !== undefined && now - previous < cooldownMs) {
    return Math.ceil((cooldownMs - (now - previous)) / 1000);
  }

  lastUse.set(key, now);
  return 0;
}

// Rend le tour au membre quand l'appel s'est arrêté AVANT l'OCR (pseudo
// manquant, format d'image refusé, analyse déjà en cours) : le cooldown
// protège le processeur, il n'a pas lieu d'être décompté si rien n'a été
// analysé. Il reste consommé après un OCR, même si rien n'est enregistré —
// sinon rescanner en boucle une feuille en doublon relancerait l'analyse
// autant de fois.
export function releaseScoreCooldown(guildId, member) {
  lastUse.delete(keyFor(guildId, member));
}
