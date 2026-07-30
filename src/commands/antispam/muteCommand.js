import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { setAntispamAction } from '../../db/antispam/setAntispamAction.js';
import { requireRole } from '../../permissions/requireRole.js';
import { COMMAND_ROLES } from '../../permissions/commandRoles.js';

const ALLOWED_ROLE_NAMES = COMMAND_ROLES.mute;

const muteCommand = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Anti-spam : supprime les messages et met le membre en timeout')
    .setDefaultMemberPermissions(0n)
    .addIntegerOption((opt) =>
      opt
        .setName('duration')
        .setDescription('Durée du timeout en secondes')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(2419200)
    ),
  async execute(interaction) {
    if (!(await requireRole(interaction, ALLOWED_ROLE_NAMES))) return;

    const duration = interaction.options.getInteger('duration', true);
    setAntispamAction(interaction.guildId, 'mute', duration);
    await interaction.reply({
      content: `Action anti-spam : suppression des messages + timeout de ${duration}s.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};

export default muteCommand;
