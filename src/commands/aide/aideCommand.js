// Liste les commandes que l'utilisateur qui invoque /aide peut réellement
// utiliser, filtrées via commandRoles.js (les descriptions viennent en
// revanche directement des commandes chargées, pas d'une copie séparée).

import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { hasRoleNamed } from '../../permissions/hasRoleNamed.js';
import { COMMAND_ROLES } from '../../permissions/commandRoles.js';

function isVisibleTo(member, roles) {
  return !roles || hasRoleNamed(member, roles);
}

const aideCommand = {
  data: new SlashCommandBuilder().setName('aide').setDescription('Liste les commandes que tu peux utiliser'),
  async execute(interaction) {
    const lines = [...interaction.client.commands.values()]
      .filter((command) => isVisibleTo(interaction.member, COMMAND_ROLES[command.data.name]))
      .sort((a, b) => a.data.name.localeCompare(b.data.name))
      .map((command) => `\`/${command.data.name}\` — ${command.data.description}`);

    await interaction.reply({
      content: lines.length > 0 ? lines.join('\n') : 'Aucune commande disponible pour toi.',
      flags: MessageFlags.Ephemeral,
    });
  },
};

export default aideCommand;
