// Commande /score : orchestre imageProcessor (normalisation) et
// scoreExtractor (OCR local + heuristique), enregistre le résultat en base
// pour permettre sa correction ultérieure via /edit-score, puis
// construit l'embed Discord (avec la photo, pour comparaison directe par un
// Référant dans le salon où la commande a été utilisée).

import { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, MessageFlags } from 'discord.js';
import { normalizeImage } from '../../score/imageProcessor.js';
import { extractScores } from '../../score/scoreExtractor.js';
import { checkScoreCooldown } from '../../score/checkScoreCooldown.js';
import { withOcrLock } from '../../score/withOcrLock.js';
import { createScoreRecord } from '../../db/scores/createScoreRecord.js';
import { ALLOWED_IMAGE_EXTENSIONS, SCORE_ZONES } from '../../config/scoreConfig.js';

const ERROR_MESSAGES = {
  UNSUPPORTED_FORMAT: `Format d'image non supporté. Formats acceptés : ${ALLOWED_IMAGE_EXTENSIONS.join(', ')}.`,
  HEIC_CONVERSION_FAILED: "Échec de la conversion de l'image HEIC/HEIF. Réessaie avec un autre format.",
};

function formatZones(zones) {
  return SCORE_ZONES.map((zone) => `${zone[0].toUpperCase()}${zone.slice(1)} : ${zones[zone]}`).join('\n');
}

function buildScoreEmbed(scores, id) {
  const warning = scores.needsReview ? ' • ⚠️ extraction incertaine' : '';

  return new EmbedBuilder()
    .setTitle('Résultats de la partie')
    .setImage('attachment://feuille.jpg')
    .addFields(
      { name: 'Tirs reçus', value: formatZones(scores.tirs_recus), inline: true },
      { name: 'Tirs envoyés', value: formatZones(scores.tirs_envoyes), inline: true }
    )
    .setFooter({ text: `ID: ${id}${warning} • Vérification recommandée par un Référant (/edit-score)` })
    .setColor(0x00aeef);
}

const scoreCommand = {
  data: new SlashCommandBuilder()
    .setName('score')
    .setDescription('Extrait les scores depuis une photo de feuille de résultats (OCR local)')
    .addAttachmentOption((opt) =>
      opt.setName('image').setDescription('Photo de la feuille de résultats').setRequired(true)
    ),
  async execute(interaction) {
    // Cooldown vérifié avant le defer : le refus reste éphémère et
    // n'encombre pas le salon.
    const waitSeconds = checkScoreCooldown(interaction.guildId, interaction.member);
    if (waitSeconds > 0) {
      await interaction.reply({
        content: `Trop de scans d'affilée — réessaie dans ${waitSeconds} seconde(s).`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply();

    const attachment = interaction.options.getAttachment('image', true);

    try {
      const rawResponse = await fetch(attachment.url);
      const buffer = Buffer.from(await rawResponse.arrayBuffer());

      const jpegBuffer = await normalizeImage(buffer, attachment.name ?? '');
      const { busy, result: scores } = await withOcrLock(() => extractScores(jpegBuffer));
      if (busy) {
        await interaction.editReply({
          content: "Une autre analyse est déjà en cours — réessaie dans quelques secondes.",
        });
        return;
      }

      const id = createScoreRecord(interaction.guildId, interaction.channelId, interaction.user.id, scores);
      const file = new AttachmentBuilder(jpegBuffer, { name: 'feuille.jpg' });

      await interaction.editReply({ embeds: [buildScoreEmbed(scores, id)], files: [file] });
    } catch (error) {
      const message = ERROR_MESSAGES[error.code] ?? "Une erreur est survenue pendant l'analyse de l'image.";
      await interaction.editReply({ content: message });
    }
  },
};

export default scoreCommand;
