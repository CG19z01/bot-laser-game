import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { getAutoroleRoles } from '../../db/autorole/getAutoroleRoles.js';
import { upsertAutoroleRole } from '../../db/autorole/upsertAutoroleRole.js';
import { updateAutoroleMessageId } from '../../db/autorole/updateAutoroleMessageId.js';
import { normalizeEmoji } from '../../autorole/normalizeEmoji.js';
import { sendLog } from '../../logs/sendLog.js';
import { requireAccess } from '../../permissions/requireAccess.js';
import { COMMAND_ACCESS } from '../../permissions/commandAccess.js';

const ACCESS = COMMAND_ACCESS.autorole;

const autoroleCommand = {
  data: new SlashCommandBuilder()
    .setName('autorole')
    .setDescription('Configure les rôles auto-assignables par réaction')
    .setDefaultMemberPermissions(0n)
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
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (!(await requireAccess(interaction, ACCESS))) return;

    const role = interaction.options.getRole('role', true);
    const emojiDisplay = interaction.options.getString('emoji', true);

    if (role.permissions.has(PermissionFlagsBits.Administrator)) {
      await interaction.editReply({
        content: "Impossible de proposer un rôle disposant de la permission Administrateur.",
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
    const content = `Choisis ta promo en cliquant sur les émojis :\n\n${lines}`;

    let message = null;
    if (messageId) {
      try {
        message = await channel.messages.fetch(messageId);
        await message.edit({ content, allowedMentions: { parse: [] } });
      } catch {
        message = null;
      }
    }
    if (!message) {
      // Le message précédent a été supprimé (ou n'existait pas encore) :
      // toutes les lignes existantes pointaient vers son ID, désormais mort.
      // Sans cette mise à jour, seul l'émoji en cours d'ajout serait
      // fonctionnel sur le nouveau message — les autres promos deviendraient
      // décoratives (message_id ne matchant plus rien en base).
      message = await channel.send({ content, allowedMentions: { parse: [] } });
      updateAutoroleMessageId(interaction.guildId, message.id);
      for (const r of updatedRoles) {
        await message.react(r.emojiDisplay);
      }
    } else {
      await message.react(emojiDisplay);
    }

    upsertAutoroleRole(interaction.guildId, emojiKey, emojiDisplay, role.id, message.id);

    await sendLog(
      interaction.client,
      `⚙️ ${interaction.user.tag} a associé ${emojiDisplay} au rôle <@&${role.id}> (\`/autorole add\`).`
    );

    await interaction.editReply({
      content: `Rôle ${role} associé à ${emojiDisplay} dans <#${channel.id}>.`,
    });
  },
};

export default autoroleCommand;
