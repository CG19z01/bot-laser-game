import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { createPoll } from '../../db/polls/createPoll.js';
import { DATE_EMOJIS } from '../../polls/dateEmojis.js';

const DATE_REGEX = /^\d{2}\/\d{2}\/\d{4}$/;

function parseDates(raw) {
  const dates = raw.split(',').map((d) => d.trim());
  if (dates.length < 2 || dates.length > DATE_EMOJIS.length) return null;
  if (dates.some((d) => !DATE_REGEX.test(d))) return null;
  return dates;
}

const sondageCommand = {
  data: new SlashCommandBuilder()
    .setName('sondage')
    .setDescription('Crée un sondage pour choisir une date')
    .addSubcommand((sub) =>
      sub
        .setName('create')
        .setDescription('Crée un sondage avec plusieurs dates au choix')
        .addStringOption((opt) =>
          opt.setName('question').setDescription('Intitulé du sondage').setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName('dates')
            .setDescription('Dates séparées par des virgules (JJ/MM/AAAA), 2 à 10')
            .setRequired(true)
        )
        .addIntegerOption((opt) =>
          opt
            .setName('seuil')
            .setDescription('Nombre de réactions (total) déclenchant la clôture')
            .setRequired(true)
            .setMinValue(1)
        )
    ),
  async execute(interaction) {
    const question = interaction.options.getString('question', true);
    const rawDates = interaction.options.getString('dates', true);
    const threshold = interaction.options.getInteger('seuil', true);

    const dates = parseDates(rawDates);
    if (!dates) {
      await interaction.reply({
        content:
          'Format invalide. Fournis 2 à 10 dates au format JJ/MM/AAAA séparées par des virgules.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const lines = dates.map((date, i) => `${DATE_EMOJIS[i]} ${date}`).join('\n');
    await interaction.reply(`**${question}**\n\n${lines}`);
    const message = await interaction.fetchReply();

    for (let i = 0; i < dates.length; i++) {
      await message.react(DATE_EMOJIS[i]);
    }

    createPoll(message.id, interaction.guildId, interaction.channelId, dates, threshold);
  },
};

export default sondageCommand;
