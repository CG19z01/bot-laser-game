// Lit le contenu chiffré d'une cellule du quadrillage.
//
// Trois précautions qui font la différence, chacune mesurée sur la feuille
// de référence (48 cellules connues) :
//  - les cellules grisées (sa propre équipe, où aucun tir n'est possible)
//    sont écartées sans OCR, sinon le gris uni y est lu comme un chiffre ;
//  - le seuil de binarisation est calculé par cellule (Otsu) et non fixé :
//    36 cellules correctes avec un seuil fixe, 47 avec Otsu ;
//  - la cellule est agrandie et entourée de blanc, Tesseract reconnaissant
//    très mal un caractère qui touche le bord de l'image.

import sharp from 'sharp';
import { GREY_CELL_MAX_RATIO } from '../config/scoreConfig.js';
import { otsuThreshold } from './otsuThreshold.js';

const INSET = 4; // écarte les traits du quadrillage, qui perturbent l'OCR
const OCR_HEIGHT = 160;
const PADDING = 30;

// Le fond de la cellule est estimé par un percentile haut plutôt que par la
// moyenne : un chiffre sombre ferait chuter la moyenne d'une case blanche.
function backgroundBrightness(pixels) {
  const sorted = Uint8Array.from(pixels).sort();
  return sorted[Math.floor(sorted.length * 0.9)];
}

export async function readCellDigits(worker, image, { x0, x1, y0, y1 }, whiteLevel) {
  const region = {
    left: x0 + INSET,
    top: y0 + INSET,
    width: x1 - x0 - 2 * INSET,
    height: y1 - y0 - 2 * INSET,
  };
  if (region.width < 6 || region.height < 6) return null;

  const cell = sharp(image).extract(region).grayscale();
  const pixels = await cell.clone().raw().toBuffer();
  if (backgroundBrightness(pixels) < whiteLevel * GREY_CELL_MAX_RATIO) return null;

  const prepared = await cell
    .resize({ height: OCR_HEIGHT })
    .threshold(otsuThreshold(pixels))
    .extend({
      top: PADDING,
      bottom: PADDING,
      left: PADDING,
      right: PADDING,
      background: '#ffffff',
    })
    .png()
    .toBuffer();

  const { data } = await worker.recognize(prepared);
  const digits = data.text.replace(/\D/g, '');
  return digits === '' ? null : Number(digits);
}
