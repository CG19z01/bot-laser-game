import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { sendLog } from '../../logs/sendLog.js';
import { requireRole } from '../../permissions/requireRole.js';
import { resolveRolesByNames } from '../../permissions/resolveRolesByNames.js';
import { resolveChannelsByNames } from '../../permissions/resolveChannelsByNames.js';
import { buildOverwriteOptions } from '../../permissions/buildOverwriteOptions.js';
import { COMMAND_ROLES } from '../../permissions/commandRoles.js';

const ALLOWED_ROLE_NAMES = COMMAND_ROLES['copie-perm'];

const copierPermissionsCommand = {
  data: new SlashCommandBuilder()
    .setName('copie-perm')
    .setDescription("Copie les autorisations d'un rôle vers plusieurs autres rôles")
    .setDefaultMemberPermissions(0n)
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
    .addStringOption((opt) =>
      opt
        .setName('salons_cibles')
        .setDescription('Salons destination si différents de "salon", séparés par ";" (nécessite "salon")')
    ),
  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (!(await requireRole(interaction, ALLOWED_ROLE_NAMES))) return;

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
    // "@@everyone" en entrée est normalisé en "@everyone" par
    // resolveRolesByNames (le préfixe "@" est retiré) et matche le vrai
    // rôle @everyone du serveur — sans cette garde, la copie globale plus
    // bas appliquerait les autorisations de `source` à tous les membres.
    if (targets.some((target) => target.id === interaction.guild.roles.everyone.id)) {
      await interaction.editReply({ content: 'Impossible de cibler @everyone avec cette commande.' });
      return;
    }
    const targetLabel = targets.map((role) => `<@&${role.id}>`).join(', ');

    const sourceSalon = interaction.options.getChannel('salon');
    const destSalonNames = interaction.options
      .getString('salons_cibles')
      ?.split(';')
      .map((name) => name.trim())
      .filter((name) => name.length > 0) ?? [];

    if (destSalonNames.length > 0 && !sourceSalon) {
      await interaction.editReply({
        content: 'Précise "salon" pour indiquer de quel salon copier les permissions.',
      });
      return;
    }

    if (sourceSalon) {
      const resolvedSalons =
        destSalonNames.length > 0
          ? resolveChannelsByNames(interaction.guild, destSalonNames)
          : [{ raw: sourceSalon.name, channel: sourceSalon }];
      const missingSalons = resolvedSalons.filter((r) => !r.channel);
      if (missingSalons.length > 0) {
        await interaction.editReply({
          content: `Salon(s) introuvable(s) : ${missingSalons.map((m) => m.raw).join(', ')}.`,
        });
        return;
      }
      const targetSalons = resolvedSalons.map((r) => r.channel);
      const salonLabel = targetSalons.map((salon) => `<#${salon.id}>`).join(', ');

      const overwrite = sourceSalon.permissionOverwrites.cache.get(source.id);
      if (!overwrite) {
        await interaction.editReply({
          content: `${source} n'a aucune permission spécifique sur ${sourceSalon}.`,
          allowedMentions: { parse: [] },
        });
        return;
      }

      const options = buildOverwriteOptions(overwrite);
      for (const targetSalon of targetSalons) {
        for (const target of targets) {
          // .create() replaces the target's overwrite entirely; .edit() merges
          // with whatever it already had, which silently mixes in stale bits.
          await targetSalon.permissionOverwrites.create(target, options);
        }
      }

      await sendLog(
        interaction.client,
        `🔑 ${interaction.user.tag} a copié les permissions de <@&${source.id}> sur <#${sourceSalon.id}> vers ${targetLabel} sur ${salonLabel}.`
      );

      await interaction.editReply({
        content: `Permissions de ${source} sur ${sourceSalon} copiées vers ${targetLabel} sur ${salonLabel}.`,
        allowedMentions: { parse: [] },
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
      content: `Autorisations de ${source} copiées vers ${targetLabel}.`,
      allowedMentions: { parse: [] },
    });
  },
};

export default copierPermissionsCommand;
