import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { getAutoroleRoles } from '../../db/autorole/getAutoroleRoles.js';
import { upsertAutoroleRole } from '../../db/autorole/upsertAutoroleRole.js';
import { normalizeEmoji } from '../../autorole/normalizeEmoji.js';

const autoroleCommand = {
  data: new SlashCommandBuilder()
    .setName('autorole')
    .setDescription('Configure les rôles auto-assignables par réaction')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand((sub) =>
      sub
        .setName('add')
        .setDescription('Ajoute un rôle associé à un émoji sur le message de réaction')
        .addRoleOption((opt) =>
          opt.setName('role').setDescription('Rôle à proposer').setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName('emoji').setDescription('Émoji associé à ce rôle').setRequired(true)
        )
    ),
  async execute(interaction) {
    const role = interaction.options.getRole('role', true);
    const emojiDisplay = interaction.options.getString('emoji', true);

    if (role.permissions.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        content: "Impossible de proposer un rôle disposant de la permission Administrateur.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const emojiKey = normalizeEmoji(emojiDisplay);
    const channel = await interaction.client.channels.fetch(interaction.client.env.roleChannelId);
    const existingRoles = getAutoroleRoles(interaction.guildId);
    const messageId = existingRoles[0]?.messageId ?? null;

    const updatedRoles = [
      ...existingRoles.filter((r) => r.emojiKey !== emojiKey),
      { emojiDisplay, roleId: role.id },
    ];
    const lines = updatedRoles.map((r) => `${r.emojiDisplay} → <@&${r.roleId}>`).join('\n');
    const content = `Réagis pour obtenir ton rôle :\n\n${lines}`;

    const message = messageId
      ? await (await channel.messages.fetch(messageId)).edit({
          content,
          allowedMentions: { parse: [] },
        })
      : await channel.send({ content, allowedMentions: { parse: [] } });

    await message.react(emojiDisplay);
    upsertAutoroleRole(interaction.guildId, emojiKey, emojiDisplay, role.id, message.id);

    await interaction.reply({
      content: `Rôle ${role} associé à ${emojiDisplay} dans <#${channel.id}>.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};

export default autoroleCommand;
