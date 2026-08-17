// Cooldown par utilisateur sur /score, modulé par ses rôles. État gardé en
// mémoire (comme trackAndCheckSpam.js) : le perdre au redémarrage est sans
// conséquence, et ça évite une écriture SQLite par appel.

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

  const key = `${guildId}:${member.id}`;
  const now = Date.now();
  const previous = lastUse.get(key);

  if (previous !== undefined && now - previous < cooldownMs) {
    return Math.ceil((cooldownMs - (now - previous)) / 1000);
  }

  lastUse.set(key, now);
  return 0;
}
