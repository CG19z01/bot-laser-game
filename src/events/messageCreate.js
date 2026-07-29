import { Events } from 'discord.js';
import { getAntispamConfig } from '../db/antispam/getAntispamConfig.js';
import { trackAndCheckSpam } from '../antispam/trackAndCheckSpam.js';
import { sendLog } from '../logs/sendLog.js';

export default {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot || !message.guild) return;

    const config = getAntispamConfig(message.guild.id);
    const spamMessages = trackAndCheckSpam(message, config.maxMessages, config.windowSeconds);
    if (!spamMessages) return;

    try {
      await message.channel.bulkDelete(spamMessages);
    } catch (error) {
      console.error('[antispam] Suppression des messages impossible:', error.message);
    }

    if (config.action !== 'mute') return;

    try {
      await message.member?.timeout(config.muteDurationSeconds * 1000, 'Anti-spam');
      await sendLog(
        message.client,
        `🔇 ${message.author.tag} mis en timeout ${config.muteDurationSeconds}s pour spam dans <#${message.channel.id}>.`
      );
    } catch (error) {
      console.error('[antispam] Timeout impossible:', error.message);
    }
  },
};
