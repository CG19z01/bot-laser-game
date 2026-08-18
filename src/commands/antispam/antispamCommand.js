import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { setAntispamLimit } from '../../db/antispam/setAntispamLimit.js';
import { requireAccess } from '../../permissions/requireAccess.js';
import { COMMAND_ACCESS } from '../../permissions/commandAccess.js';

const ACCESS = COMMAND_ACCESS.antispam;

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
    if (!(await requireAccess(interaction, ACCESS))) return;

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
