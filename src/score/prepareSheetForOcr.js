// Rehausse le contraste de la feuille entière avant la lecture des cellules.
// readCellDigits applique ensuite un second rehaussement, local à chaque
// cellule : les deux sont nécessaires, retirer l'un ou l'autre fait chuter la
// reconnaissance d'environ 44 cellules correctes sur 48 à une trentaine.

import sharp from 'sharp';

export function prepareSheetForOcr(image) {
  return sharp(image).grayscale().normalize().png().toBuffer();
}
