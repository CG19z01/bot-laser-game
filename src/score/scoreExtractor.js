// Orchestration de l'extraction : de la photo brute aux valeurs du joueur.
//
// Le pseudo est fourni par l'appelant, pas lu sur la feuille : la lecture
// OCR d'un nom propre est nettement moins fiable que celle d'un chiffre, et
// une erreur dessus rattacherait la partie au mauvais joueur. Il sert ici à
// retrouver la ligne du joueur dans le tableau de gauche (Eff. Tir, Score).
//
// Chaque valeur provient de la lecture de sa propre cellule. Les totaux
// d'en-tête (« 26 Reçues Joueur(s) », « 39 Données ») servent uniquement à
// VÉRIFIER le résultat, jamais à compléter une cellule illisible : une case
// ratée doit rester visible comme telle, pas être devinée par soustraction.

import { createWorker, PSM } from 'tesseract.js';
import { OCR_LANGUAGE, SCORE_ZONES } from '../config/scoreConfig.js';
import { cropToSheet } from './cropToSheet.js';
import { deskewSheet } from './deskewSheet.js';
import { detectGrid } from './detectGrid.js';
import { prepareSheetForOcr } from './prepareSheetForOcr.js';
import { sheetWhiteLevel } from './sheetWhiteLevel.js';
import { readCellDigits } from './readCellDigits.js';
import { readSheetHeader } from './readSheetHeader.js';
import { readPlayerLine } from './readPlayerLine.js';

// Tableau du milieu : Av Ar Ep Pi Total  -> les zones commencent en colonne 0
// Tableau de droite : Total Av Ar Ep Pi  -> elles commencent en colonne 1
const RECUS_OFFSET = 0;
const DONNES_OFFSET = 1;

function tableRegion(table, rows) {
  return {
    left: table[0],
    top: rows[0].y0,
    width: table[table.length - 1] - table[0],
    height: rows[rows.length - 1].y1 - rows[0].y0,
  };
}

async function sumZoneColumns(worker, image, table, offset, rows, whiteLevel) {
  const totals = Object.fromEntries(SCORE_ZONES.map((zone) => [zone.key, 0]));

  for (const row of rows) {
    for (let column = 0; column < SCORE_ZONES.length; column++) {
      const value = await readCellDigits(
        worker,
        image,
        {
          x0: table[column + offset],
          x1: table[column + offset + 1],
          y0: row.y0,
          y1: row.y1,
        },
        whiteLevel
      );
      if (value !== null) totals[SCORE_ZONES[column].key] += value;
    }
  }

  return totals;
}

export async function extractScores(imageBuffer, pseudo) {
  const sheet = await deskewSheet(await cropToSheet(imageBuffer));
  const { rows, tables } = await detectGrid(sheet);
  if (tables.length < 3) {
    const error = new Error('Les trois tableaux attendus n\'ont pas été trouvés.');
    error.code = 'GRID_INCOMPLETE';
    throw error;
  }

  const image = await prepareSheetForOcr(sheet);
  const worker = await createWorker(OCR_LANGUAGE);

  try {
    const header = await readSheetHeader(worker, image, rows[0].y0);
    const player = await readPlayerLine(worker, image, tables[0], rows, pseudo);

    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_WORD,
      tessedit_char_whitelist: '0123456789',
    });

    const recus = await sumZoneColumns(
      worker, image, tables[1], RECUS_OFFSET, rows,
      await sheetWhiteLevel(image, tableRegion(tables[1], rows))
    );
    const donnes = await sumZoneColumns(
      worker, image, tables[2], DONNES_OFFSET, rows,
      await sheetWhiteLevel(image, tableRegion(tables[2], rows))
    );

    return {
      pseudo,
      pseudoFound: player.found,
      effTir: player.effTir,
      score: player.score,
      recus,
      donnes,
      checks: {
        recus: { lu: sum(recus), attendu: header.recusTotal },
        donnes: { lu: sum(donnes), attendu: header.donnesTotal },
      },
    };
  } finally {
    await worker.terminate();
  }
}

function sum(totals) {
  return Object.values(totals).reduce((a, b) => a + b, 0);
}
