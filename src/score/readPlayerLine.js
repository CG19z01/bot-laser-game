// Retrouve la ligne du joueur dans le tableau de gauche et y lit son
// Eff. Tir et son Score. Le pseudo vient de la commande, pas de l'OCR.

import { PSM } from 'tesseract.js';
import { readCellText } from './readCellText.js';
import { findPlayerRow } from './findPlayerRow.js';

// L'OCR ne reconnaît pas la virgule de « 1,82 s » et rend « 182s ». Comme
// l'Eff. Tir est toujours exprimé en secondes avec deux décimales sur cette
// feuille, on replace le séparateur d'après ce format fixe — on décode une
// mise en forme connue, on ne devine pas une valeur.
function parseEffTir(text) {
  const digits = text.replace(/\D/g, '');
  if (digits.length < 3) return null;
  return (Number(digits) / 100).toFixed(2);
}

export async function readPlayerLine(worker, image, table, rows, pseudo) {
  const names = [];
  for (const row of rows) {
    names.push(
      await readCellText(worker, image, { x0: table[0], x1: table[1], y0: row.y0, y1: row.y1 }, {
        psm: PSM.SINGLE_LINE,
        whitelist: '',
      })
    );
  }

  const index = findPlayerRow(names, pseudo);
  if (index < 0) return { found: false, effTir: null, score: null };

  const row = rows[index];
  // Le « s » de « 1,82 s » est autorisé puis écarté : exclu de la liste, il
  // était reconnu comme un « 5 » et collé à la valeur (1,82 -> 1.825).
  const effTirText = await readCellText(worker, image, { x0: table[1], x1: table[2], y0: row.y0, y1: row.y1 }, {
    psm: PSM.SINGLE_WORD,
    whitelist: '0123456789,.s',
  });
  const scoreText = await readCellText(worker, image, { x0: table[2], x1: table[3], y0: row.y0, y1: row.y1 }, {
    psm: PSM.SINGLE_WORD,
    whitelist: '0123456789+-',
  });

  const score = scoreText.replace(/[^0-9+-]/g, '');
  return {
    found: true,
    effTir: parseEffTir(effTirText),
    score: score === '' ? null : Number(score),
  };
}
