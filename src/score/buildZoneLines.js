// Met en forme les 4 zones d'un bloc (reçus ou donnés) pour un embed, avec
// le total. Partagé par /score et /stats pour que les deux affichent
// exactement la même présentation.

import { SCORE_ZONES } from '../config/scoreConfig.js';

export function buildZoneLines(zones) {
  const lines = SCORE_ZONES.map((zone) => `${zone.label} : ${zones[zone.key] ?? 0}`);
  const total = SCORE_ZONES.reduce((sum, zone) => sum + (zones[zone.key] ?? 0), 0);
  return [...lines, `**Total : ${total}**`].join('\n');
}
