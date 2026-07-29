import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { sendLog } from '../../logs/sendLog.js';
import { hasRoleNamed } from '../../permissions/hasRoleNamed.js';
import { resolveRolesByNames } from '../../permissions/resolveRolesByNames.js';

const ALLOWED_ROLE_NAMES = ['Administrateur', 'STAFF'];

function buildOverwriteOptions(overwrite) {
  const options = {};
  for (const flag of overwrite.allow.toArray()) options[flag] = true;
  for (const flag of overwrite.deny.toArray()) options[flag] = false;
  return options;
}

const copierPermissionsCommand = {
  data: new SlashCommandBuilder()
    .setName('copier-permissions')
    .setDescription("Copie les autorisations d'un rôle vers plusieurs autres rôles")
    .addRoleOption((opt) =>
      opt.setName('source').setDescription('Rôle dont copier les autorisations').setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName('cibles')
        .setDescription('Rôles destinataires, noms exacts séparés par ";"')
        .setRequired(true)
    )
    .addChannelOption((opt) =>
      opt
        .setName('salon')
        .setDescription('Si fourni, copie uniquement les permissions de ce salon (pas les autorisations globales)')
    )
    .addChannelOption((opt) =>
      opt
        .setName('salon_cible')
        .setDescription('Salon destination si différent de "salon" (nécessite "salon")')
    ),
  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (!hasRoleNamed(interaction.member, ALLOWED_ROLE_NAMES)) {
      await interaction.editReply({ content: 'Réservé aux rôles Administrateur et STAFF.' });
      return;
    }

    const source = interaction.options.getRole('source', true);
    if (source.permissions.has(PermissionFlagsBits.Administrator)) {
      await interaction.editReply({
        content: "Impossible de copier les autorisations d'un rôle Administrateur.",
      });
      return;
    }

    const targetNames = interaction.options
      .getString('cibles', true)
      .split(';')
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    const resolved = resolveRolesByNames(interaction.guild, targetNames);
    const missing = resolved.filter((r) => !r.role);
    if (missing.length > 0) {
      await interaction.editReply({
        content: `Rôle(s) introuvable(s) : ${missing.map((m) => m.raw).join(', ')}.`,
      });
      return;
    }
    const targets = resolved.map((r) => r.role);
    const targetLabel = targets.map((role) => role.name).join(', ');

    const sourceSalon = interaction.options.getChannel('salon');
    const destSalon = interaction.options.getChannel('salon_cible');

    if (destSalon && !sourceSalon) {
      await interaction.editReply({
        content: 'Précise "salon" pour indiquer de quel salon copier les permissions.',
      });
      return;
    }

    if (sourceSalon) {
      const targetSalon = destSalon ?? sourceSalon;
      const overwrite = sourceSalon.permissionOverwrites.cache.get(source.id);
      if (!overwrite) {
        await interaction.editReply({
          content: `${source} n'a aucune permission spécifique sur ${sourceSalon}.`,
        });
        return;
      }

      const options = buildOverwriteOptions(overwrite);
      for (const target of targets) {
        await targetSalon.permissionOverwrites.edit(target, options);
      }

      await sendLog(
        interaction.client,
        `🔑 ${interaction.user.tag} a copié les permissions de <@&${source.id}> sur <#${sourceSalon.id}> vers ${targetLabel} sur <#${targetSalon.id}>.`
      );

      await interaction.editReply({
        content: `Permissions de ${source} sur ${sourceSalon} copiées vers ${targets.length} rôle(s) sur ${targetSalon} : ${targetLabel}.`,
      });
      return;
    }

    for (const target of targets) {
      await target.setPermissions(source.permissions);
    }

    await sendLog(
      interaction.client,
      `🔑 ${interaction.user.tag} a copié les autorisations de <@&${source.id}> vers ${targetLabel}.`
    );

    await interaction.editReply({
      content: `Autorisations de ${source} copiées vers ${targets.length} rôle(s) : ${targetLabel}.`,
    });
  },
};

export default copierPermissionsCommand;
