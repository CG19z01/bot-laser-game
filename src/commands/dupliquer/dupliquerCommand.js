import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } from 'discord.js';
import { sendLog } from '../../logs/sendLog.js';
import { requireAccess } from '../../permissions/requireAccess.js';
import { resolveRolesByNames } from '../../permissions/resolveRolesByNames.js';
import { COMMAND_ACCESS } from '../../permissions/commandAccess.js';
import { cloneCategoryWithChildren } from '../../permissions/cloneCategoryWithChildren.js';

const ACCESS = COMMAND_ACCESS['copie-cat'];
const ACCESS_PERMISSIONS = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.AttachFiles,
  PermissionFlagsBits.UseExternalEmojis,
];

// Exportée (en plus de l'export par défaut) uniquement pour être testée
// unitairement — pas d'autre appelant en dehors de ce fichier.
export function buildOverwrites(everyoneId, roles) {
  return [
    { id: everyoneId, deny: [PermissionFlagsBits.ViewChannel] },
    ...roles.map((role) => ({ id: role.id, allow: ACCESS_PERMISSIONS })),
  ];
}

const dupliquerCommand = {
  data: new SlashCommandBuilder()
    .setName('copie-cat')
    .setDescription('Duplique une catégorie et tous ses salons')
    .setDefaultMemberPermissions(0n)
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
        .setDescription('Rôles ayant accès, séparés par ";" (Administrateur déjà inclus)')
    ),
  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (!(await requireAccess(interaction, ACCESS))) {
      await sendLog(
        interaction.client,
        `⛔ ${interaction.user.tag} a tenté \`/copie-cat\` sans les droits requis.`
      );
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

    const roleNames = [...ACCESS.roles, ...extraRoleNames];
    const resolved = resolveRolesByNames(interaction.guild, roleNames);
    const missing = resolved.filter((r) => !r.role);
    if (missing.length > 0) {
      await interaction.editReply({
        content: `Rôle(s) introuvable(s) : ${missing.map((m) => m.raw).join(', ')}.`,
      });
      return;
    }
    const roles = resolved.map((r) => r.role);

    const overwrites = buildOverwrites(interaction.guild.roles.everyone.id, roles);
    const children = await cloneCategoryWithChildren(source, newName, () => overwrites);

    await sendLog(
      interaction.client,
      `📁 ${interaction.user.tag} a dupliqué "${source.name}" en "${newName}" (${children.length} salon(s), rôles: ${roles.map((r) => r.name).join(', ')}).`
    );

    await interaction.editReply({
      content: `Catégorie "${newName}" créée avec ${children.length} salon(s) dupliqué(s).`,
    });
  },
};

export default dupliquerCommand;
