// Lit le bandeau au-dessus des tableaux pour en extraire les deux totaux
// généraux, qui servent de somme de contrôle à l'extraction.
//
// Le pseudo n'est pas lu ici : il est saisi par l'utilisateur dans la
// commande, la reconnaissance d'un nom propre étant bien moins sûre que
// celle d'un nombre.
//
// Les expressions régulières sont volontairement tolérantes sur les lettres
// accentuées : l'OCR rend « Reçues » en « Regues » et « Données » en
// « Donnees » selon l'éclairage. Seuls les nombres doivent être exacts, et
// ils le sont.

import sharp from 'sharp';
import { PSM } from 'tesseract.js';

const RECUS_PATTERN = /(\d+)\s*re[cgqç]ues?\s*joueur/i;
const DONNES_PATTERN = /(\d+)\s*donn[ée3]{1,2}es/i;

function firstNumber(text, pattern) {
  const match = text.match(pattern);
  return match ? Number(match[1].replace(/\s/g, '')) : null;
}

export async function readSheetHeader(worker, image, firstRowTop) {
  const { width } = await sharp(image).metadata();
  const band = { left: 0, top: 0, width, height: firstRowTop };

  const cropped = await sharp(image)
    .extract(band)
    .resize({ width: width * 2 })
    .png()
    .toBuffer();

  await worker.setParameters({
    tessedit_pageseg_mode: PSM.SPARSE_TEXT,
    tessedit_char_whitelist: '',
  });
  const { data } = await worker.recognize(cropped);

  return {
    recusTotal: firstNumber(data.text, RECUS_PATTERN),
    donnesTotal: firstNumber(data.text, DONNES_PATTERN),
  };
}
