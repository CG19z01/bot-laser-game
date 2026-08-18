// Liste les commandes que l'utilisateur qui invoque /aide peut réellement
// utiliser, filtrées via commandAccess.js (les descriptions viennent en
// revanche directement des commandes chargées, pas d'une copie séparée).
//
// Le filtre applique les mêmes conditions que l'exécution, permission
// Discord comprise : une commande dont le rôle convient mais dont la
// permission manque n'est pas listée, sinon /aide promettrait un accès que
// la commande refuserait ensuite.

import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { hasAccess } from '../../permissions/hasAccess.js';
import { COMMAND_ACCESS } from '../../permissions/commandAccess.js';

const aideCommand = {
  data: new SlashCommandBuilder().setName('aide').setDescription('Liste les commandes que tu peux utiliser'),
  async execute(interaction) {
    const lines = [...interaction.client.commands.values()]
      .filter((command) => hasAccess(interaction.member, COMMAND_ACCESS[command.data.name]).allowed)
      .sort((a, b) => a.data.name.localeCompare(b.data.name))
      .map((command) => `\`/${command.data.name}\` — ${command.data.description}`);

    await interaction.reply({
      content: lines.length > 0 ? lines.join('\n') : 'Aucune commande disponible pour toi.',
      flags: MessageFlags.Ephemeral,
    });
  },
};

export default aideCommand;
