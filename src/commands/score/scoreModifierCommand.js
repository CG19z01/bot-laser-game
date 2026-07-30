// Commande réservée à Administrateur/STAFF/Référant pour corriger une valeur
// extraite automatiquement par /score, après comparaison avec la photo
// (l'OCR local est peu fiable — voir src/score/scoreExtractor.js). Séparée
// de scoreCommand.js : responsabilité distincte (correction vs extraction).

import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { requireRole } from '../../permissions/requireRole.js';
import { getScoreRecord } from '../../db/scores/getScoreRecord.js';
import { updateScoreField } from '../../db/scores/updateScoreField.js';
import { sendLog } from '../../logs/sendLog.js';
import { COMMAND_ROLES } from '../../permissions/commandRoles.js';

const ALLOWED_ROLE_NAMES = COMMAND_ROLES['edit-score'];

const FIELD_CHOICES = [
  { name: 'Tirs reçus - Pistolet', value: 'tirs_recus_pistolet' },
  { name: 'Tirs reçus - Plastron', value: 'tirs_recus_plastron' },
  { name: 'Tirs reçus - Épaules', value: 'tirs_recus_epaules' },
  { name: 'Tirs reçus - Dos', value: 'tirs_recus_dos' },
  { name: 'Tirs envoyés - Pistolet', value: 'tirs_envoyes_pistolet' },
  { name: 'Tirs envoyés - Plastron', value: 'tirs_envoyes_plastron' },
  { name: 'Tirs envoyés - Épaules', value: 'tirs_envoyes_epaules' },
  { name: 'Tirs envoyés - Dos', value: 'tirs_envoyes_dos' },
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

    await interaction.reply(`✅ Score #${id} mis à jour : \`${field}\` ${oldValue} → ${value}`);

    await sendLog(
      interaction.client,
      `📝 ${interaction.user.tag} a modifié le score #${id} (\`${field}\`) : ${oldValue} → ${value} dans <#${interaction.channelId}>.`
    );
  },
};

export default scoreModifierCommand;
