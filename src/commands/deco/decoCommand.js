// Commande d'arrêt manuel du bot, réservée à Administrateur. Arrête le
// process Node (process.exit), pas seulement la connexion Discord — comme
// le fait déjà le handler SIGINT/SIGTERM dans index.js. Il n'y a pas de
// redémarrage automatique : quelqu'un doit relancer `npm start` ensuite.

import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { hasRoleNamed } from '../../permissions/hasRoleNamed.js';
import { sendLog } from '../../logs/sendLog.js';

const ALLOWED_ROLE_NAMES = ['Administrateur'];

const decoCommand = {
  data: new SlashCommandBuilder()
    .setName('deco')
    .setDescription('Déconnecte le bot (arrêt du process, redémarrage manuel requis)')
    .setDefaultMemberPermissions(0n),
  async execute(interaction) {
    if (!hasRoleNamed(interaction.member, ALLOWED_ROLE_NAMES)) {
      await interaction.reply({ content: 'Réservé au rôle Administrateur.', flags: MessageFlags.Ephemeral });
      return;
    }

    await interaction.reply({ content: '🔴 Déconnexion du bot en cours...', flags: MessageFlags.Ephemeral });
    await sendLog(interaction.client, `🔴 Bot déconnecté manuellement par ${interaction.user.tag} (\`/deco\`).`);
    process.exit(0);
  },
};

export default decoCommand;
