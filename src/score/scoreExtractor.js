// Extrait les scores d'une feuille de résultats déjà normalisée en JPEG, via
// OCR local (Tesseract.js — pas d'appel API externe, gratuit). Séparé
// d'imageProcessor.js car c'est une étape de reconnaissance de texte, pas de
// transformation d'image.
//
// Heuristique : on ne connaît pas la mise en page exacte de la feuille, donc
// on ne peut pas découper des cellules précises. On repère tous les nombres
// reconnus par l'OCR, on les trie dans l'ordre de lecture (haut en bas,
// gauche à droite), et on les assigne positionnellement aux 8 zones
// attendues (tirs reçus : pistolet/plastron/épaules/dos, puis tirs envoyés :
// même ordre). C'est fragile — d'où la vérification humaine par un Référant
// via /score-modifier après coup (scores.needsReview signale les cas où le
// nombre de valeurs trouvées ne correspond pas au nombre attendu).

import { createWorker } from 'tesseract.js';
import { OCR_LANGUAGE, SCORE_ZONES } from '../config/scoreConfig.js';

const FIELD_ORDER = [
  ...SCORE_ZONES.map((zone) => ['tirs_recus', zone]),
  ...SCORE_ZONES.map((zone) => ['tirs_envoyes', zone]),
];

// Exportée en plus d'extractScores() uniquement pour être testée
// unitairement — pas d'autre appelant en dehors de ce fichier.
export function extractNumbersInReadingOrder(words) {
  return words
    .filter((word) => /^\d+$/.test(word.text.trim()))
    .sort((a, b) => a.bbox.y0 - b.bbox.y0 || a.bbox.x0 - b.bbox.x0)
    .map((word) => Number.parseInt(word.text, 10));
}

export async function extractScores(imageBuffer) {
  const worker = await createWorker(OCR_LANGUAGE);
  let words;
  try {
    const { data } = await worker.recognize(imageBuffer);
    words = data.words;
  } finally {
    await worker.terminate();
  }

  const numbers = extractNumbersInReadingOrder(words);
  const needsReview = numbers.length !== FIELD_ORDER.length;

  const scores = { tirs_recus: {}, tirs_envoyes: {}, needsReview };
  FIELD_ORDER.forEach(([table, zone], index) => {
    scores[table][zone] = numbers[index] ?? 0;
  });

  return scores;
}
