// Construit l'embed de résultat de /score.
//
// L'embed distingue explicitement une extraction vérifiée d'une extraction
// douteuse : les totaux lus dans les tableaux sont comparés à ceux imprimés
// en en-tête de la feuille. En cas d'écart, les chiffres sont affichés quand
// même mais signalés, à corriger via /edit-score — jamais recalculés.

import { EmbedBuilder } from 'discord.js';
import { buildZoneLines } from './buildZoneLines.js';

function checkLine({ lu, attendu }, label) {
  if (attendu === null) return `⚠️ ${label} : total de contrôle illisible`;
  if (lu !== attendu) return `⚠️ ${label} : ${lu} lus pour ${attendu} attendus`;
  return `✅ ${label} : ${lu}`;
}

export function buildScoreEmbed(result, id) {
  const reliable =
    result.checks.recus.lu === result.checks.recus.attendu &&
    result.checks.donnes.lu === result.checks.donnes.attendu;

  const embed = new EmbedBuilder()
    .setTitle(`Partie de ${result.pseudo}`)
    .setImage('attachment://feuille.jpg')
    .addFields(
      { name: 'Coups reçus', value: buildZoneLines(result.recus), inline: true },
      { name: 'Coups donnés', value: buildZoneLines(result.donnes), inline: true },
      {
        name: 'Vérification',
        value: [
          checkLine(result.checks.recus, 'Reçus'),
          checkLine(result.checks.donnes, 'Donnés'),
        ].join('\n'),
      }
    )
    .setColor(reliable ? 0x2ecc71 : 0xe67e22)
    .setFooter({
      text: reliable
        ? `ID: ${id} • correction possible avec /edit-score`
        : `ID: ${id} • ⚠️ chiffres à vérifier puis corriger avec /edit-score`,
    });

  const details = [];
  if (result.effTir) details.push(`Eff. Tir : ${result.effTir} s`);
  if (result.score !== null) details.push(`Score : ${result.score > 0 ? '+' : ''}${result.score}`);
  if (details.length > 0) embed.setDescription(details.join(' • '));

  return embed;
}
