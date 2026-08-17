// Niveau de « blanc » du papier, servant de référence pour juger si une
// cellule est grisée. On prend un percentile haut plutôt que le maximum :
// un reflet isolé fausserait complètement la référence.
//
// La mesure est faite par zone et non sur la feuille entière : l'éclairage
// d'une photo n'est jamais uniforme. Sur la feuille de référence, le tableau
// de droite est sensiblement plus sombre que celui du milieu — avec une
// référence globale, toutes ses cellules étaient prises pour des cellules
// grisées et le tableau entier ressortait vide.

import sharp from 'sharp';

const PERCENTILE = 0.9;

export async function sheetWhiteLevel(image, region) {
  const source = sharp(image).grayscale();
  const data = await (region ? source.extract(region) : source).raw().toBuffer();
  const sorted = Uint8Array.from(data).sort();
  return sorted[Math.floor(sorted.length * PERCENTILE)];
}
