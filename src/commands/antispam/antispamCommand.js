import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { setAntispamLimit } from '../../db/antispam/setAntispamLimit.js';
import { hasRoleNamed } from '../../permissions/hasRoleNamed.js';

const ALLOWED_ROLE_NAMES = ['Administrateur', 'STAFF'];

const antispamCommand = {
  data: new SlashCommandBuilder()
    .setName('antispam')
    .setDescription("Configure la protection anti-spam du serveur")
    .setDefaultMemberPermissions(0n)
    .addSubcommand((sub) =>
      sub
        .setName('limit')
        .setDescription('Définit le seuil de déclenchement anti-spam')
        .addIntegerOption((opt) =>
          opt
            .setName('messages')
            .setDescription('Nombre de messages')
            .setRequired(true)
            .setMinValue(2)
            .setMaxValue(50)
        )
        .addIntegerOption((opt) =>
          opt
            .setName('seconde')
            .setDescription('Fenêtre de temps en secondes')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(300)
        )
    ),
  async execute(interaction) {
    if (!hasRoleNamed(interaction.member, ALLOWED_ROLE_NAMES)) {
      await interaction.reply({
        content: 'Réservé aux rôles Administrateur et STAFF.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const messages = interaction.options.getInteger('messages', true);
    const seconde = interaction.options.getInteger('seconde', true);
    setAntispamLimit(interaction.guildId, messages, seconde);
    await interaction.reply({
      content: `Seuil anti-spam défini : ${messages} messages / ${seconde}s.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};

export default antispamCommand;
