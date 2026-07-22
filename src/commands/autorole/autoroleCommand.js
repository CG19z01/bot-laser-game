import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { setAutoroleRoleId } from '../../db/autorole/setAutoroleRoleId.js';

const autoroleCommand = {
  data: new SlashCommandBuilder()
    .setName('autorole')
    .setDescription('Configure le rôle attribué automatiquement aux nouveaux membres')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand((sub) =>
      sub
        .setName('set')
        .setDescription('Définit le rôle à attribuer automatiquement')
        .addRoleOption((opt) =>
          opt.setName('role').setDescription('Rôle à attribuer').setRequired(true)
        )
    ),
  async execute(interaction) {
    const role = interaction.options.getRole('role', true);

    if (role.permissions.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        content:
          "Impossible d'attribuer automatiquement un rôle disposant de la permission Administrateur.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    setAutoroleRoleId(interaction.guildId, role.id);
    await interaction.reply({
      content: `Le rôle ${role} sera désormais attribué automatiquement aux nouveaux membres.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};

export default autoroleCommand;
