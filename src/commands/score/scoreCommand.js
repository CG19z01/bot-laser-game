// Commande /score : normalise la photo, extrait les valeurs de la feuille,
// vérifie que la feuille n'a pas déjà été scannée, enregistre la partie et
// affiche le résultat (mise en forme dans buildScoreEmbed.js).
//
// La réponse est différée en éphémère : tous les refus (doublon, pseudo
// absent, photo inexploitable) ne sont donc visibles que de l'auteur, et
// n'encombrent pas le salon. Seul un enregistrement réussi produit un
// message public, envoyé en complément.

import { SlashCommandBuilder, AttachmentBuilder, MessageFlags } from 'discord.js';
import { normalizeImage } from '../../score/imageProcessor.js';
import { extractScores } from '../../score/scoreExtractor.js';
import { checkScoreCooldown, releaseScoreCooldown } from '../../score/checkScoreCooldown.js';
import { withOcrLock } from '../../score/withOcrLock.js';
import { createScoreRecord } from '../../db/scores/createScoreRecord.js';
import { getPlayerPseudo } from '../../db/pseudos/getPlayerPseudo.js';
import { findDuplicateScore } from '../../db/scores/findDuplicateScore.js';
import { buildScoreEmbed } from '../../score/buildScoreEmbed.js';
import { discordTimestamp } from '../../score/discordTimestamp.js';
import { ALLOWED_IMAGE_EXTENSIONS, PSEUDO_MAX_LENGTH } from '../../config/scoreConfig.js';

const ERROR_MESSAGES = {
  UNSUPPORTED_FORMAT: `Format d'image non supporté. Formats acceptés : ${ALLOWED_IMAGE_EXTENSIONS.join(', ')}.`,
  HEIC_CONVERSION_FAILED: "Échec de la conversion de l'image HEIC/HEIF. Réessaie avec un autre format.",
  SHEET_NOT_FOUND: 'Feuille non détectée. Photographie-la à plat, entière et bien éclairée.',
  SHEET_TOO_SMALL: 'La feuille occupe une trop petite partie de la photo. Rapproche-toi.',
  GRID_NOT_FOUND: 'Tableaux non détectés. Vérifie que la photo est nette et prise de face.',
  GRID_INCOMPLETE: 'Les trois tableaux de la feuille ne sont pas tous visibles sur la photo.',
};

const scoreCommand = {
  data: new SlashCommandBuilder()
    .setName('score')
    .setDescription('Extrait les scores depuis une photo de feuille de résultats (OCR local)')
    .addAttachmentOption((opt) =>
      opt.setName('image').setDescription('Photo de la feuille de résultats').setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName('pseudo')
        .setDescription('Pseudo sur la feuille (par défaut : celui de /mon-pseudo)')
        // Même limite que /mon-pseudo : au-delà, le pseudo dépasserait la
        // taille maximale d'un titre d'embed et l'affichage échouerait.
        .setMaxLength(PSEUDO_MAX_LENGTH)
    )
    .addUserOption((opt) =>
      opt.setName('joueur').setDescription('Membre à qui attribuer la partie (par défaut : toi)')
    ),
  async execute(interaction) {
    const waitSeconds = checkScoreCooldown(interaction.guildId, interaction.member);
    if (waitSeconds > 0) {
      await interaction.reply({
        content: `Trop de scans d'affilée — réessaie dans ${waitSeconds} seconde(s).`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const owner = interaction.options.getUser('joueur') ?? interaction.user;
    const pseudo =
      interaction.options.getString('pseudo') ?? getPlayerPseudo(interaction.guildId, owner.id);
    if (!pseudo) {
      releaseScoreCooldown(interaction.guildId, interaction.member);
      await interaction.reply({
        content:
          'Précise le pseudo inscrit sur la feuille (option `pseudo`), ou enregistre-le une fois pour toutes avec /mon-pseudo.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const attachment = interaction.options.getAttachment('image', true);
    let ocrRan = false;

    try {
      const response = await fetch(attachment.url);
      const buffer = Buffer.from(await response.arrayBuffer());
      const jpeg = await normalizeImage(buffer, attachment.name ?? '');

      const { busy, result } = await withOcrLock(() => extractScores(jpeg, pseudo));
      if (busy) {
        releaseScoreCooldown(interaction.guildId, interaction.member);
        await interaction.editReply({
          content: 'Une autre analyse est déjà en cours — réessaie dans quelques secondes.',
        });
        return;
      }
      ocrRan = true;

      if (!result.pseudoFound) {
        await interaction.editReply({
          content: `Le pseudo **${pseudo}** n'a pas été trouvé sur cette feuille. Vérifie l'orthographe, ou que c'est bien la bonne feuille.`,
          allowedMentions: { parse: [] },
        });
        return;
      }

      const duplicate = findDuplicateScore(interaction.guildId, owner.id, result);
      if (duplicate) {
        await interaction.editReply({
          content: `Cette feuille a déjà été enregistrée (score **#${duplicate.id}**, le ${discordTimestamp(duplicate.created_at)}). Elle n'a pas été comptée une seconde fois.`,
          allowedMentions: { parse: [] },
        });
        return;
      }

      const id = createScoreRecord(
        interaction.guildId,
        interaction.channelId,
        interaction.user.id,
        owner.id,
        result
      );
      await interaction.followUp({
        embeds: [buildScoreEmbed(result, id)],
        files: [new AttachmentBuilder(jpeg, { name: 'feuille.jpg' })],
        allowedMentions: { parse: [] },
      });
      await interaction.deleteReply();
    } catch (error) {
      if (!ocrRan) releaseScoreCooldown(interaction.guildId, interaction.member);
      const message = ERROR_MESSAGES[error.code] ?? "Une erreur est survenue pendant l'analyse de l'image.";
      await interaction.editReply({ content: message });
    }
  },
};

export default scoreCommand;
