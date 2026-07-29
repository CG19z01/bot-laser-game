import { Events } from 'discord.js';
import { getAutoroleRoleForReaction } from '../db/autorole/getAutoroleRoleForReaction.js';
import { getEmojiKeyFromReaction } from '../autorole/getEmojiKeyFromReaction.js';
import { sendLog } from '../logs/sendLog.js';

export default {
  name: Events.MessageReactionAdd,
  async execute(reaction, user) {
    if (user.bot) return;
    if (reaction.partial) await reaction.fetch();

    const guildId = reaction.message.guild?.id;
    if (!guildId) return;

    const roleId = getAutoroleRoleForReaction(
      guildId,
      reaction.message.id,
      getEmojiKeyFromReaction(reaction)
    );
    if (!roleId) return;

    try {
      const member = await reaction.message.guild.members.fetch(user.id);
      await member.roles.add(roleId);
      await sendLog(reaction.client, `✅ Rôle <@&${roleId}> attribué à ${user.tag} (réaction).`);
    } catch (error) {
      console.error(`[autorole] Impossible d'attribuer le rôle ${roleId}:`, error.message);
    }
  },
};
