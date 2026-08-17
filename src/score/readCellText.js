// Lit le contenu textuel d'une cellule (pseudo, « 1,82 s », « +2600 »).
// Distinct de readCellDigits.js, qui ne lit que des chiffres isolés et
// écarte les cellules grisées : ici on veut la chaîne brute, avec une liste
// de caractères autorisés adaptée à ce qu'on cherche.

import sharp from 'sharp';
import { otsuThreshold } from './otsuThreshold.js';

const INSET = 4;
const OCR_HEIGHT = 120;
const PADDING = 25;

export async function readCellText(worker, image, { x0, x1, y0, y1 }, { psm, whitelist }) {
  const region = {
    left: x0 + INSET,
    top: y0 + INSET,
    width: x1 - x0 - 2 * INSET,
    height: y1 - y0 - 2 * INSET,
  };
  if (region.width < 6 || region.height < 6) return '';

  const cell = sharp(image).extract(region).grayscale();
  const pixels = await cell.clone().raw().toBuffer();

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

  await worker.setParameters({
    tessedit_pageseg_mode: psm,
    tessedit_char_whitelist: whitelist,
  });
  const { data } = await worker.recognize(prepared);
  return data.text.trim();
}
