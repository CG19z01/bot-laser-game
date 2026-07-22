import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { setAntispamLimit } from '../../db/antispam/setAntispamLimit.js';
import { setAntispamAction } from '../../db/antispam/setAntispamAction.js';

const antispamCommand = {
  data: new SlashCommandBuilder()
    .setName('antispam')
    .setDescription("Configure la protection anti-spam du serveur")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand((sub) =>
      sub
        .setName('set-limit')
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
            .setName('window')
            .setDescription('Fenêtre de temps en secondes')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(300)
        )
    )
    .addSubcommandGroup((group) =>
      group
        .setName('action')
        .setDescription("Définit l'action prise en cas de spam")
        .addSubcommand((sub) =>
          sub.setName('delete').setDescription('Supprime uniquement les messages en trop')
        )
        .addSubcommand((sub) =>
          sub
            .setName('mute')
            .setDescription('Supprime les messages et met le membre en timeout')
            .addIntegerOption((opt) =>
              opt
                .setName('duration')
                .setDescription('Durée du timeout en secondes')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(2419200)
            )
        )
    ),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'set-limit') {
      const messages = interaction.options.getInteger('messages', true);
      const window = interaction.options.getInteger('window', true);
      setAntispamLimit(interaction.guildId, messages, window);
      await interaction.reply({
        content: `Seuil anti-spam défini : ${messages} messages / ${window}s.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (sub === 'delete') {
      setAntispamAction(interaction.guildId, 'delete');
      await interaction.reply({
        content: 'Action anti-spam : suppression des messages uniquement.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const duration = interaction.options.getInteger('duration', true);
    setAntispamAction(interaction.guildId, 'mute', duration);
    await interaction.reply({
      content: `Action anti-spam : suppression des messages + timeout de ${duration}s.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};

export default antispamCommand;
