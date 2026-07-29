import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } from 'discord.js';
import { sendLog } from '../../logs/sendLog.js';

const ALLOWED_ROLE_NAMES = ['Administrateur', 'STAFF'];
const ACCESS_PERMISSIONS = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.AttachFiles,
  PermissionFlagsBits.UseExternalEmojis,
];

function buildOverwrites(everyoneId, roles) {
  return [
    { id: everyoneId, deny: [PermissionFlagsBits.ViewChannel] },
    ...roles.map((role) => ({ id: role.id, allow: ACCESS_PERMISSIONS })),
  ];
}

const dupliquerCommand = {
  data: new SlashCommandBuilder()
    .setName('dupliquer')
    .setDescription('Duplique une catégorie et tous ses salons')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption((opt) =>
      opt
        .setName('categorie')
        .setDescription('Catégorie à dupliquer')
        .addChannelTypes(ChannelType.GuildCategory)
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName('nom').setDescription('Nom de la nouvelle catégorie').setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName('roles')
        .setDescription('Rôles ayant accès, séparés par ";" (Administrateur et STAFF déjà inclus)')
    ),
  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const isAllowed = interaction.member.roles.cache.some((role) =>
      ALLOWED_ROLE_NAMES.includes(role.name)
    );
    if (!isAllowed) {
      await sendLog(
        interaction.client,
        `⛔ ${interaction.user.tag} a tenté \`/dupliquer\` sans le rôle Administrateur/STAFF.`
      );
      await interaction.editReply({ content: 'Réservé aux rôles Administrateur et STAFF.' });
      return;
    }

    const source = interaction.options.getChannel('categorie', true);
    const newName = interaction.options.getString('nom', true);
    const extraRoleNames =
      interaction.options
        .getString('roles')
        ?.split(';')
        .map((name) => name.trim())
        .filter((name) => name.length > 0) ?? [];

    const roleNames = [...ALLOWED_ROLE_NAMES, ...extraRoleNames];
    const roles = roleNames.map((name) => interaction.guild.roles.cache.find((r) => r.name === name));
    const missingIndex = roles.findIndex((role) => !role);
    if (missingIndex !== -1) {
      await interaction.editReply({ content: `Aucun rôle nommé "${roleNames[missingIndex]}" trouvé.` });
      return;
    }

    const overwrites = buildOverwrites(interaction.guild.roles.everyone.id, roles);

    const newCategory = await source.clone({ name: newName, permissionOverwrites: overwrites });

    const children = [...source.children.cache.values()].sort((a, b) => a.position - b.position);
    for (const child of children) {
      const clone = await child.clone({ name: child.name, permissionOverwrites: overwrites });
      await clone.setParent(newCategory.id, { lockPermissions: false });
    }

    await sendLog(
      interaction.client,
      `📁 ${interaction.user.tag} a dupliqué "${source.name}" en "${newName}" (${children.length} salon(s), rôles: ${roleNames.join(', ')}).`
    );

    await interaction.editReply({
      content: `Catégorie "${newName}" créée avec ${children.length} salon(s) dupliqué(s).`,
    });
  },
};

export default dupliquerCommand;
