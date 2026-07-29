import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { setAntispamAction } from '../../db/antispam/setAntispamAction.js';
import { sendLog } from '../../logs/sendLog.js';

const DEFAULT_USER_DELETE_COUNT = 10;

async function purgeMessages(channel, count, userId) {
  if (!userId) {
    const deleted = await channel.bulkDelete(count, true);
    return deleted.size;
  }

  const recentMessages = await channel.messages.fetch({ limit: 100 });
  const targetMessages = [...recentMessages.values()]
    .filter((message) => message.author.id === userId)
    .slice(0, count);

  if (targetMessages.length === 0) return 0;
  if (targetMessages.length === 1) {
    await targetMessages[0].delete();
    return 1;
  }

  const deleted = await channel.bulkDelete(targetMessages, true);
  return deleted.size;
}

const deleteCommand = {
  data: new SlashCommandBuilder()
    .setName('delete')
    .setDescription(
      "Supprime des messages, ou configure l'action anti-spam si aucun paramètre"
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((opt) =>
      opt.setName('user').setDescription('Utilisateur dont supprimer les messages')
    )
    .addIntegerOption((opt) =>
      opt
        .setName('nombre')
        .setDescription(`Nombre de messages à supprimer (défaut : ${DEFAULT_USER_DELETE_COUNT})`)
        .setMinValue(2)
        .setMaxValue(100)
    ),
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const nombre = interaction.options.getInteger('nombre');

    if (!user && !nombre) {
      setAntispamAction(interaction.guildId, 'delete');
      await interaction.reply({
        content: 'Action anti-spam : suppression des messages uniquement.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const count = nombre ?? DEFAULT_USER_DELETE_COUNT;
    const deletedCount = await purgeMessages(interaction.channel, count, user?.id);

    await sendLog(
      interaction.client,
      `🧹 ${interaction.user.tag} a purgé ${deletedCount} message(s)${user ? ` de ${user.tag}` : ''} dans <#${interaction.channel.id}>.`
    );

    await interaction.reply({
      content: `${deletedCount} message(s) supprimé(s)${user ? ` de ${user}` : ''}.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};

export default deleteCommand;
