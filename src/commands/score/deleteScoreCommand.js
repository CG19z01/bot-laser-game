// Supprime une partie enregistrée par /score : scan de test, feuille
// attribuée au mauvais joueur, ou doublon passé au travers de la détection.
//
// La suppression est définitive et sans confirmation : le message de retour
// récapitule donc précisément ce qui a été retiré (joueur, totaux, date),
// pour qu'une erreur d'ID se voie immédiatement et puisse être ressaisie.

import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { requireRole } from '../../permissions/requireRole.js';
import { getScoreRecord } from '../../db/scores/getScoreRecord.js';
import { deleteScoreRecord } from '../../db/scores/deleteScoreRecord.js';
import { sendLog } from '../../logs/sendLog.js';
import { COMMAND_ROLES } from '../../permissions/commandRoles.js';
import { SCORE_ZONES } from '../../config/scoreConfig.js';
import { discordTimestamp } from '../../score/discordTimestamp.js';

const ALLOWED_ROLE_NAMES = COMMAND_ROLES['delete-score'];

function summarize(record) {
  const total = (prefix) => SCORE_ZONES.reduce((sum, zone) => sum + record[`${prefix}_${zone.key}`], 0);
  return `**${record.pseudo}** — ${total('recus')} reçus / ${total('donnes')} donnés (enregistré le ${discordTimestamp(record.created_at)})`;
}

const deleteScoreCommand = {
  data: new SlashCommandBuilder()
    .setName('delete-score')
    .setDescription('Supprime définitivement une partie enregistrée par /score')
    .setDefaultMemberPermissions(0n)
    .addIntegerOption((opt) =>
      opt
        .setName('id')
        .setDescription("ID du score (pied de l'embed /score)")
        .setRequired(true)
        .setMinValue(1)
    ),
  async execute(interaction) {
    if (!(await requireRole(interaction, ALLOWED_ROLE_NAMES))) return;

    const id = interaction.options.getInteger('id', true);
    const record = getScoreRecord(id);
    if (!record) {
      await interaction.reply({
        content: `Aucun score avec l'ID ${id}.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const summary = summarize(record);
    deleteScoreRecord(id);

    await interaction.reply({
      content: `🗑️ Score **#${id}** supprimé : ${summary}`,
      allowedMentions: { parse: [] },
    });

    await sendLog(
      interaction.client,
      `🗑️ ${interaction.user.tag} a supprimé le score #${id} : ${summary} — dans <#${interaction.channelId}>.`
    );
  },
};

export default deleteScoreCommand;
