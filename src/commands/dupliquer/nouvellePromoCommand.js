// Duplique une catégorie de promo comme /copie-cat, mais au lieu d'un jeu de
// permissions fixe, copie fidèlement les permissions existantes de chaque
// salon source et substitue uniquement le rôle de promo (role_source ->
// role_cible) — STAFF, Référant et tout autre rôle configuré sur la source
// sont copiés tels quels, sans modification.

import { SlashCommandBuilder, ChannelType, MessageFlags } from 'discord.js';
import { sendLog } from '../../logs/sendLog.js';
import { requireAccess } from '../../permissions/requireAccess.js';
import { COMMAND_ACCESS } from '../../permissions/commandAccess.js';
import { cloneCategoryWithChildren } from '../../permissions/cloneCategoryWithChildren.js';

const ACCESS = COMMAND_ACCESS['nouvelle-promo'];

function transposeOverwrites(channel, roleSourceId, roleCibleId) {
  return channel.permissionOverwrites.cache.map((overwrite) => ({
    id: overwrite.id === roleSourceId ? roleCibleId : overwrite.id,
    allow: overwrite.allow.toArray(),
    deny: overwrite.deny.toArray(),
  }));
}

const nouvellePromoCommand = {
  data: new SlashCommandBuilder()
    .setName('nouvelle-promo')
    .setDescription('Duplique une catégorie de promo en transposant ses permissions vers un nouveau rôle')
    .setDefaultMemberPermissions(0n)
    .addChannelOption((opt) =>
      opt
        .setName('categorie')
        .setDescription('Catégorie de la promo source à dupliquer')
        .addChannelTypes(ChannelType.GuildCategory)
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName('nom').setDescription('Nom de la nouvelle catégorie').setRequired(true)
    )
    .addRoleOption((opt) =>
      opt
        .setName('role_source')
        .setDescription('Rôle de la promo source (modèle des permissions)')
        .setRequired(true)
    )
    .addRoleOption((opt) =>
      opt.setName('role_cible').setDescription('Rôle de la nouvelle promo (déjà créé)').setRequired(true)
    ),
  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (!(await requireAccess(interaction, ACCESS))) return;

    const source = interaction.options.getChannel('categorie', true);
    const newName = interaction.options.getString('nom', true);
    const roleSource = interaction.options.getRole('role_source', true);
    const roleCible = interaction.options.getRole('role_cible', true);

    const children = await cloneCategoryWithChildren(source, newName, (channel) =>
      transposeOverwrites(channel, roleSource.id, roleCible.id)
    );

    await sendLog(
      interaction.client,
      `📁 ${interaction.user.tag} a créé la promo "${newName}" à partir de "${source.name}" (${children.length} salon(s), <@&${roleSource.id}> → <@&${roleCible.id}>).`
    );

    await interaction.editReply({
      content: `Catégorie "${newName}" créée avec ${children.length} salon(s), permissions transposées de ${roleSource} vers ${roleCible}.`,
      allowedMentions: { parse: [] },
    });
  },
};

export default nouvellePromoCommand;
