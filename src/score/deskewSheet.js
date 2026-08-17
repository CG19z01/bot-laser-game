// Corrige l'inclinaison d'une photo prise à main levée. Même 1° suffit à
// décaler une ligne de balayage de plusieurs rangées entre la gauche et la
// droite de la feuille, ce qui rend le découpage des cellules inutilisable.
//
// Méthode du profil de projection : on essaie plusieurs angles et on garde
// celui qui rend les traits horizontaux les plus nets. Quand l'image est
// droite, les pixels sombres d'un trait tombent tous sur la même ligne, ce
// qui produit un pic ; la somme des carrés récompense ces pics.

import sharp from 'sharp';
import {
  DARK_PIXEL_THRESHOLD,
  DESKEW_MAX_ANGLE,
  DESKEW_STEP,
} from '../config/scoreConfig.js';

async function horizontalSharpness(buffer, angle) {
  const image = sharp(buffer).grayscale();
  const rotated = angle === 0 ? image : image.rotate(angle, { background: '#ffffff' });
  const { data, info } = await rotated.raw().toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  let score = 0;
  for (let y = 0; y < height; y++) {
    let dark = 0;
    for (let x = 0; x < width; x++) {
      if (data[y * width + x] < DARK_PIXEL_THRESHOLD) dark++;
    }
    score += dark * dark;
  }
  return score;
}

export async function deskewSheet(buffer) {
  let bestAngle = 0;
  let bestScore = -1;

  for (let angle = -DESKEW_MAX_ANGLE; angle <= DESKEW_MAX_ANGLE; angle += DESKEW_STEP) {
    const score = await horizontalSharpness(buffer, angle);
    if (score > bestScore) {
      bestScore = score;
      bestAngle = angle;
    }
  }

  if (bestAngle === 0) return buffer;
  return sharp(buffer).rotate(bestAngle, { background: '#ffffff' }).png().toBuffer();
}
