// Commande réservée à Administrateur/STAFF/Référant pour corriger une valeur
// extraite automatiquement par /score, après comparaison avec la photo.
// Indispensable : l'OCR laisse passer environ une cellule sur cinquante, et
// la vérification par somme de contrôle signale l'écart sans le corriger.

import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { requireRole } from '../../permissions/requireRole.js';
import { getScoreRecord } from '../../db/scores/getScoreRecord.js';
import { updateScoreField } from '../../db/scores/updateScoreField.js';
import { sendLog } from '../../logs/sendLog.js';
import { COMMAND_ROLES } from '../../permissions/commandRoles.js';
import { SCORE_ZONES } from '../../config/scoreConfig.js';

const ALLOWED_ROLE_NAMES = COMMAND_ROLES['edit-score'];

const FIELD_CHOICES = [
  ...SCORE_ZONES.map((zone) => ({ name: `Reçus - ${zone.label}`, value: `recus_${zone.key}` })),
  ...SCORE_ZONES.map((zone) => ({ name: `Donnés - ${zone.label}`, value: `donnes_${zone.key}` })),
];

const scoreModifierCommand = {
  data: new SlashCommandBuilder()
    .setName('edit-score')
    .setDescription('Corrige une valeur extraite par /score après vérification')
    .setDefaultMemberPermissions(0n)
    .addIntegerOption((opt) =>
      opt.setName('id').setDescription("ID du score (pied de l'embed /score)").setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName('champ').setDescription('Champ à corriger').setRequired(true).addChoices(...FIELD_CHOICES)
    )
    .addIntegerOption((opt) =>
      opt.setName('valeur').setDescription('Nouvelle valeur').setRequired(true).setMinValue(0)
    ),
  async execute(interaction) {
    if (!(await requireRole(interaction, ALLOWED_ROLE_NAMES))) return;

    const id = interaction.options.getInteger('id', true);
    const field = interaction.options.getString('champ', true);
    const value = interaction.options.getInteger('valeur', true);

    const record = getScoreRecord(id);
    if (!record) {
      await interaction.reply({ content: `Aucun score avec l'ID ${id}.`, flags: MessageFlags.Ephemeral });
      return;
    }

    const oldValue = record[field];
    updateScoreField(id, field, value);

    // Le pseudo est du texte libre saisi par un membre : sans allowedMentions,
    // un pseudo « @everyone » ferait pinguer tout le serveur depuis ce
    // message public.
    await interaction.reply({
      content: `✅ Score #${id} (${record.pseudo}) mis à jour : \`${field}\` ${oldValue} → ${value}`,
      allowedMentions: { parse: [] },
    });

    await sendLog(
      interaction.client,
      `📝 ${interaction.user.tag} a modifié le score #${id} de ${record.pseudo} (\`${field}\`) : ${oldValue} → ${value} dans <#${interaction.channelId}>.`
    );
  },
};

export default scoreModifierCommand;
