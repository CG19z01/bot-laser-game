import 'dotenv/config';

const REQUIRED_VARS = ['DISCORD_TOKEN', 'CLIENT_ID', 'GUILD_ID', 'ADMIN_CHANNEL_ID'];

export function loadEnv() {
  for (const key of REQUIRED_VARS) {
    if (!process.env[key]) {
      throw new Error(`Variable d'environnement manquante: ${key}`);
    }
  }
  return {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID,
    adminChannelId: process.env.ADMIN_CHANNEL_ID,
  };
}
