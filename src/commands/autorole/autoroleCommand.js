import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { getAutoroleConfig } from '../../db/autorole/getAutoroleConfig.js';
import { setAutoroleConfig } from '../../db/autorole/setAutoroleConfig.js';
import { AUTOROLE_EMOJI } from '../../autorole/roleEmoji.js';

const autoroleCommand = {
  data: new SlashCommandBuilder()
    .setName('autorole')
    .setDescription('Configure le rôle auto-assignable par réaction')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand((sub) =>
      sub
        .setName('set')
        .setDescription('Définit le rôle et poste le message de réaction')
        .addRoleOption((opt) =>
          opt.setName('role').setDescription('Rôle à proposer').setRequired(true)
        )
    ),
  async execute(interaction) {
    const role = interaction.options.getRole('role', true);

    if (role.permissions.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        content: "Impossible de proposer un rôle disposant de la permission Administrateur.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const channel = await interaction.client.channels.fetch(interaction.client.env.roleChannelId);

    const previous = getAutoroleConfig(interaction.guildId);
    if (previous?.messageId) {
      try {
        const oldMessage = await channel.messages.fetch(previous.messageId);
        await oldMessage.delete();
      } catch {
        // message déjà supprimé ou inaccessible, on l'ignore
      }
    }

    const message = await channel.send({
      content: `Réagis avec ${AUTOROLE_EMOJI} pour accéder au serveur ${role}.`,
      allowedMentions: { parse: [] },
    });
    await message.react(AUTOROLE_EMOJI);

    setAutoroleConfig(interaction.guildId, role.id, message.id);

    await interaction.reply({
      content: `Message de rôle posté dans <#${channel.id}>.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};

export default autoroleCommand;
