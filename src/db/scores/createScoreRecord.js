import { getDb } from '../database.js';

export function createScoreRecord(guildId, channelId, submittedBy, scores) {
  const result = getDb()
    .prepare(
      `INSERT INTO score_records (
         guild_id, channel_id, submitted_by,
         tirs_recus_pistolet, tirs_recus_plastron, tirs_recus_epaules, tirs_recus_dos,
         tirs_envoyes_pistolet, tirs_envoyes_plastron, tirs_envoyes_epaules, tirs_envoyes_dos
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      guildId,
      channelId,
      submittedBy,
      scores.tirs_recus.pistolet,
      scores.tirs_recus.plastron,
      scores.tirs_recus.epaules,
      scores.tirs_recus.dos,
      scores.tirs_envoyes.pistolet,
      scores.tirs_envoyes.plastron,
      scores.tirs_envoyes.epaules,
      scores.tirs_envoyes.dos
    );

  return result.lastInsertRowid;
}
