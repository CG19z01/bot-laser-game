import { Events } from 'discord.js';
import { getAutoroleConfig } from '../db/autorole/getAutoroleConfig.js';
import { AUTOROLE_EMOJI } from '../autorole/roleEmoji.js';

export default {
  name: Events.MessageReactionAdd,
  async execute(reaction, user) {
    if (user.bot) return;
    if (reaction.partial) await reaction.fetch();
    if (reaction.emoji.name !== AUTOROLE_EMOJI) return;

    const guildId = reaction.message.guild?.id;
    if (!guildId) return;

    const config = getAutoroleConfig(guildId);
    if (!config || config.messageId !== reaction.message.id) return;

    try {
      const member = await reaction.message.guild.members.fetch(user.id);
      await member.roles.add(config.roleId);
    } catch (error) {
      console.error(`[autorole] Impossible d'attribuer le rôle ${config.roleId}:`, error.message);
    }
  },
};
