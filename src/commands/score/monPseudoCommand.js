// Associe un compte Discord à un pseudo laser game, pour que /stats sache
// quelles parties appartiennent à qui. Les feuilles ne portent que le pseudo
// imprimé, jamais l'identité Discord : sans cette association, impossible de
// rattacher un historique à un membre.

import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { setPlayerPseudo } from '../../db/pseudos/setPlayerPseudo.js';
import { getPlayerPseudo } from '../../db/pseudos/getPlayerPseudo.js';
import { PSEUDO_MAX_LENGTH } from '../../config/scoreConfig.js';

const monPseudoCommand = {
  data: new SlashCommandBuilder()
    .setName('mon-pseudo')
    .setDescription('Associe ton pseudo laser game à ton compte Discord')
    .addStringOption((opt) =>
      opt
        .setName('pseudo')
        .setDescription('Pseudo tel qu\'il apparaît en haut de ta feuille de résultats')
        .setRequired(true)
        .setMaxLength(PSEUDO_MAX_LENGTH)
    ),
  async execute(interaction) {
    const pseudo = interaction.options.getString('pseudo', true).trim();
    if (pseudo.length < 2) {
      await interaction.reply({
        content: 'Pseudo trop court (2 caractères minimum).',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const previous = getPlayerPseudo(interaction.guildId, interaction.user.id);
    setPlayerPseudo(interaction.guildId, interaction.user.id, pseudo);

    await interaction.reply({
      content: previous
        ? `Pseudo mis à jour : **${previous}** → **${pseudo}**.`
        : `Pseudo enregistré : **${pseudo}**. Tu peux maintenant utiliser /stats.`,
      flags: MessageFlags.Ephemeral,
      allowedMentions: { parse: [] },
    });
  },
};

export default monPseudoCommand;
