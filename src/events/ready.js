import { Events } from 'discord.js';
import { sendLog } from '../logs/sendLog.js';

export default {
  name: Events.ClientReady,
  async execute(client) {
    console.log(`Connecté en tant que ${client.user.tag}`);
    await sendLog(client, `🟢 Bot connecté (${client.user.tag}).`);
  },
};
