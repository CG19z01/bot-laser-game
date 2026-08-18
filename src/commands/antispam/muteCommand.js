import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { setAntispamAction } from '../../db/antispam/setAntispamAction.js';
import { requireAccess } from '../../permissions/requireAccess.js';
import { COMMAND_ACCESS } from '../../permissions/commandAccess.js';

const ACCESS = COMMAND_ACCESS.mute;

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
    if (!(await requireAccess(interaction, ACCESS))) return;

    const duration = interaction.options.getInteger('duration', true);
    setAntispamAction(interaction.guildId, 'mute', duration);
    await interaction.reply({
      content: `Action anti-spam : suppression des messages + timeout de ${duration}s.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};

export default muteCommand;
