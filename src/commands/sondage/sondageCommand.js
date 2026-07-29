import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { createPoll } from '../../db/polls/createPoll.js';
import { sendLog } from '../../logs/sendLog.js';
import { hasRoleNamed } from '../../permissions/hasRoleNamed.js';
import { DATE_EMOJIS } from '../../polls/dateEmojis.js';

const DATE_REGEX = /^\d{2}\/\d{2}\/\d{4}$/;
const ALLOWED_ROLE_NAMES = ['Administrateur', 'STAFF', 'Référant'];

function parseDates(raw) {
  const cleaned = raw.trim().replace(/;+\s*$/, '');
  const dates = cleaned.split(';').map((d) => d.trim());
  if (dates.length < 1 || dates.length > DATE_EMOJIS.length) return null;
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
        .setDescription('Crée un sondage pour une session avec plusieurs dates au choix')
        .addStringOption((opt) =>
          opt.setName('lieu').setDescription('Nom du lieu').setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName('ville').setDescription('Ville où se déroule la session').setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName('dates')
            .setDescription('Dates séparées par des points-virgules (JJ/MM/AAAA), 1 à 10')
            .setRequired(true)
        )
        .addIntegerOption((opt) =>
          opt
            .setName('nombre_personnes')
            .setDescription('Nombre de personnes pour la session')
            .setRequired(true)
            .setMinValue(1)
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
    if (!hasRoleNamed(interaction.member, ALLOWED_ROLE_NAMES)) {
      await interaction.reply({
        content: 'Réservé aux rôles Administrateur, STAFF et Référant.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const lieu = interaction.options.getString('lieu', true);
    const ville = interaction.options.getString('ville', true);
    const rawDates = interaction.options.getString('dates', true);
    const nombrePersonnes = interaction.options.getInteger('nombre_personnes', true);
    const threshold = interaction.options.getInteger('seuil', true);

    const dates = parseDates(rawDates);
    if (!dates) {
      await interaction.reply({
        content:
          'Format invalide. Fournis 1 à 10 dates au format JJ/MM/AAAA séparées par des points-virgules.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const lines = dates.map((date, i) => `${DATE_EMOJIS[i]} ${date}`).join('\n');
    await interaction.reply({
      content: `📍 **${lieu}**, ${ville}\n\n${lines}\n\n👥 ${nombrePersonnes} personnes`,
      allowedMentions: { parse: [] },
    });
    const message = await interaction.fetchReply();

    for (let i = 0; i < dates.length; i++) {
      await message.react(DATE_EMOJIS[i]);
    }

    createPoll(message.id, interaction.guildId, interaction.channelId, dates, threshold);

    await sendLog(
      interaction.client,
      `🗳️ ${interaction.user.tag} a créé un sondage "${lieu}, ${ville}" (${dates.length} date(s), seuil ${threshold}) dans <#${interaction.channelId}>.`
    );
  },
};

export default sondageCommand;
