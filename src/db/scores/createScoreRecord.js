import { getDb } from '../database.js';

export function createScoreRecord(guildId, channelId, submittedBy, userId, extraction) {
  const { pseudo, effTir, score, recus, donnes } = extraction;

  const result = getDb()
    .prepare(
      `INSERT INTO score_records (
         guild_id, channel_id, submitted_by, user_id, pseudo, eff_tir, score,
         recus_av, recus_ar, recus_ep, recus_pi,
         donnes_av, donnes_ar, donnes_ep, donnes_pi
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      guildId,
      channelId,
      submittedBy,
      userId,
      pseudo,
      effTir,
      score,
      recus.av,
      recus.ar,
      recus.ep,
      recus.pi,
      donnes.av,
      donnes.ar,
      donnes.ep,
      donnes.pi
    );

  return result.lastInsertRowid;
}
