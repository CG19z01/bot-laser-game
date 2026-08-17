// Affiche le cumul des coups reçus et donnés d'un joueur, zone par zone,
// sur toutes ses parties enregistrées via /score.
//
// Le regroupement se fait sur le compte Discord et non sur le pseudo : un
// joueur ne porte pas forcément le même nom d'une session à l'autre. Le
// pseudo ne sert qu'à l'affichage.

import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { getPlayerPseudo } from '../../db/pseudos/getPlayerPseudo.js';
import { getPlayerTotals } from '../../db/scores/getPlayerTotals.js';
import { buildZoneLines } from '../../score/buildZoneLines.js';

function splitZones(totals) {
  return {
    recus: { av: totals.recus_av, ar: totals.recus_ar, ep: totals.recus_ep, pi: totals.recus_pi },
    donnes: { av: totals.donnes_av, ar: totals.donnes_ar, ep: totals.donnes_ep, pi: totals.donnes_pi },
  };
}

const statsCommand = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Affiche le cumul de tes coups reçus et donnés')
    .addUserOption((opt) =>
      opt.setName('membre').setDescription("Membre dont afficher les stats (par défaut : toi)")
    ),
  async execute(interaction) {
    const target = interaction.options.getUser('membre') ?? interaction.user;
    const isSelf = target.id === interaction.user.id;

    const totals = getPlayerTotals(interaction.guildId, target.id);
    if (!totals || totals.parties === 0) {
      await interaction.reply({
        content: isSelf
          ? "Aucune partie enregistrée pour toi. Utilise /score avec la photo de ta feuille."
          : `Aucune partie enregistrée pour ${target.username}.`,
        flags: MessageFlags.Ephemeral,
        allowedMentions: { parse: [] },
      });
      return;
    }

    const label = getPlayerPseudo(interaction.guildId, target.id) ?? target.username;
    const { recus, donnes } = splitZones(totals);
    const embed = new EmbedBuilder()
      .setTitle(`${label} — ${totals.parties} partie(s)`)
      .addFields(
        { name: 'Coups reçus', value: buildZoneLines(recus), inline: true },
        { name: 'Coups donnés', value: buildZoneLines(donnes), inline: true }
      )
      .setColor(0x00aeef);

    await interaction.reply({ embeds: [embed], allowedMentions: { parse: [] } });
  },
};

export default statsCommand;
