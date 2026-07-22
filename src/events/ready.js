import { Events } from 'discord.js';

export default {
  name: Events.ClientReady,
  execute(client) {
    console.log(`Connecté en tant que ${client.user.tag}`);
  },
};
