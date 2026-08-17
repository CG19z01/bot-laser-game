// Détecte qu'une feuille a déjà été scannée, pour éviter qu'une même partie
// soit comptée deux fois dans /stats.
//
// L'empreinte n'utilise QUE des valeurs lues de façon fiable : les deux
// totaux imprimés en en-tête, le score et l'Eff. Tir. Les valeurs cellule
// par cellule sont volontairement exclues — l'OCR en rate parfois une, donc
// deux photos de la même feuille peuvent produire des chiffres légèrement
// différents et passeraient à travers.
//
// La date et le numéro de partie auraient été une clé plus directe, mais
// leur impression est trop petite et trop pâle pour être lue de façon sûre,
// même à pleine résolution (vérifié sur la feuille de référence).

import { getDb } from '../database.js';

export function findDuplicateScore(guildId, userId, { effTir, score, checks }) {
  const recusTotal = checks.recus.attendu;
  const donnesTotal = checks.donnes.attendu;

  // Sans au moins un total de contrôle lisible, l'empreinte serait trop
  // faible pour distinguer deux parties : on préfère ne rien bloquer.
  if (recusTotal === null && donnesTotal === null) return null;

  return (
    getDb()
      .prepare(
        `SELECT id, created_at FROM score_records
         WHERE guild_id = ? AND user_id = ?
           AND recus_total IS ? AND donnes_total IS ?
           AND score IS ? AND eff_tir IS ?
         ORDER BY id DESC LIMIT 1`
      )
      .get(guildId, userId, recusTotal, donnesTotal, score, effTir) ?? null
  );
}
