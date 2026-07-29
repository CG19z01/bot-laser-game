import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { sendLog } from '../../logs/sendLog.js';
import { hasRoleNamed } from '../../permissions/hasRoleNamed.js';

const ALLOWED_ROLE_NAMES = ['Administrateur', 'STAFF', 'Référant'];

function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function buildTeams(names, teamCount) {
  const shuffled = shuffle(names);
  const teams = Array.from({ length: teamCount }, () => []);
  shuffled.forEach((name, i) => teams[i % teamCount].push(name));
  return teams;
}

const equipesCommand = {
  data: new SlashCommandBuilder()
    .setName('equipes')
    .setDescription('Forme des équipes aléatoires à partir d\'une liste de joueurs')
    .addIntegerOption((opt) =>
      opt.setName('equipes').setDescription("Nombre d'équipes").setRequired(true).setMinValue(2)
    )
    .addIntegerOption((opt) =>
      opt
        .setName('nombre')
        .setDescription('Nombre de joueurs (doit correspondre au nombre de noms dans "users")')
        .setRequired(true)
        .setMinValue(6)
        .setMaxValue(40)
    )
    .addStringOption((opt) =>
      opt
        .setName('users')
        .setDescription('Noms des joueurs séparés par des virgules')
        .setRequired(true)
    ),
  async execute(interaction) {
    if (!hasRoleNamed(interaction.member, ALLOWED_ROLE_NAMES)) {
      await interaction.reply({
        content: 'Réservé aux rôles Administrateur, STAFF et Référant.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const teamCount = interaction.options.getInteger('equipes', true);
    const expectedCount = interaction.options.getInteger('nombre', true);
    const rawUsers = interaction.options.getString('users', true);

    const names = rawUsers
      .split(',')
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    if (names.length !== expectedCount) {
      await interaction.reply({
        content: `Le nombre indiqué (${expectedCount}) ne correspond pas au nombre de noms trouvés dans "users" (${names.length}). Vérifie les virgules.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (teamCount > names.length) {
      await interaction.reply({
        content: `Impossible de créer ${teamCount} équipes avec seulement ${names.length} joueurs.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const teams = buildTeams(names, teamCount);
    const content = teams.map((team, i) => `**Équipe ${i + 1}**\n${team.join('\n')}`).join('\n\n');

    await interaction.reply({ content, allowedMentions: { parse: [] } });

    await sendLog(
      interaction.client,
      `🎲 ${interaction.user.tag} a généré ${teamCount} équipes pour ${names.length} joueurs dans <#${interaction.channelId}>.`
    );
  },
};

export default equipesCommand;
