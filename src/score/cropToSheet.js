// Isole la feuille de résultats du reste de la photo (table, sol, mains).
// Sans ce recadrage, l'arrière-plan fausse tout : sur une table sombre, la
// détection de traits voit des « traits » sur toute la largeur de l'image.
//
// La feuille est claire et peu saturée ; on garde la plus grande zone qui
// remplit ces deux critères, puis on rogne un peu plus pour écarter l'ombre
// portée sur les bords.

import sharp from 'sharp';
import {
  SHEET_WORK_WIDTH,
  SHEET_MIN_BRIGHTNESS,
  SHEET_MAX_SATURATION,
  SHEET_CROP_PADDING,
} from '../config/scoreConfig.js';

function isSheetPixel(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max === 0 ? 0 : (max - min) / max;
  return max > SHEET_MIN_BRIGHTNESS && saturation < SHEET_MAX_SATURATION;
}

// Boîte englobante en coordonnées relatives (0-1), mesurée sur une version
// très réduite : on cherche une forme, la finesse n'apporte rien ici.
async function findSheetBounds(buffer) {
  const { data, info } = await sharp(buffer)
    .resize({ width: 500 })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let count = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      if (!isSheetPixel(data[i], data[i + 1], data[i + 2])) continue;
      count++;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  if (count < width * height * 0.15) {
    const error = new Error("Feuille non détectée sur la photo.");
    error.code = 'SHEET_NOT_FOUND';
    throw error;
  }

  return { minX: minX / width, minY: minY / height, maxX: maxX / width, maxY: maxY / height };
}

export async function cropToSheet(buffer) {
  const bounds = await findSheetBounds(buffer);

  // Le redimensionnement est matérialisé avant de mesurer : sharp.metadata()
  // décrit l'image source, pas le résultat des opérations en attente.
  const resized = await sharp(buffer).resize({ width: SHEET_WORK_WIDTH }).png().toBuffer();
  const { width, height } = await sharp(resized).metadata();

  const left = Math.round((bounds.minX + SHEET_CROP_PADDING) * width);
  const top = Math.round((bounds.minY + SHEET_CROP_PADDING) * height);
  const cropWidth = Math.round((bounds.maxX - bounds.minX - 2 * SHEET_CROP_PADDING) * width);
  const cropHeight = Math.round((bounds.maxY - bounds.minY - 2 * SHEET_CROP_PADDING) * height);

  if (cropWidth < 200 || cropHeight < 150) {
    const error = new Error('Zone de feuille trop petite pour être exploitée.');
    error.code = 'SHEET_TOO_SMALL';
    throw error;
  }

  // PNG et non JPEG : chaque ré-encodage JPEG abîme un peu plus les petits
  // chiffres du tableau, qui ne font qu'une dizaine de pixels de haut.
  return sharp(resized)
    .extract({ left, top, width: cropWidth, height: cropHeight })
    .png()
    .toBuffer();
}
