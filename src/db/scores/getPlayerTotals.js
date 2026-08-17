import { getDb } from '../database.js';

// Cumul de toutes les parties d'un joueur, regroupées par compte Discord et
// non par pseudo : un même joueur ne porte pas forcément le même nom d'une
// session à l'autre, et regrouper par texte éclaterait son historique.
export function getPlayerTotals(guildId, userId) {
  return getDb()
    .prepare(
      `SELECT
         COUNT(*)             AS parties,
         SUM(recus_av)        AS recus_av,
         SUM(recus_ar)        AS recus_ar,
         SUM(recus_ep)        AS recus_ep,
         SUM(recus_pi)        AS recus_pi,
         SUM(donnes_av)       AS donnes_av,
         SUM(donnes_ar)       AS donnes_ar,
         SUM(donnes_ep)       AS donnes_ep,
         SUM(donnes_pi)       AS donnes_pi
       FROM score_records
       WHERE guild_id = ? AND user_id = ?`
    )
    .get(guildId, userId);
}
