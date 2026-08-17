// Normalise n'importe quel format d'attachment Discord (iOS .heic/.heif,
// Android .jpg/.png/.webp) en un buffer JPEG redimensionné, point d'entrée du
// pipeline d'extraction. Séparé de scoreExtractor.js car c'est une
// transformation d'image pure, sans dépendance à l'OCR — testable et
// remplaçable seule.
//
// La couleur est conservée : cropToSheet.js s'en sert pour distinguer la
// feuille (claire, peu saturée) de l'arrière-plan. Le passage en niveaux de
// gris se fait plus loin, seulement là où c'est utile.

import sharp from 'sharp';
import convert from 'heic-convert';
import {
  ALLOWED_IMAGE_EXTENSIONS,
  HEIC_EXTENSIONS,
  MAX_IMAGE_DIMENSION,
  JPEG_QUALITY,
} from '../config/scoreConfig.js';

function getExtension(filename) {
  return filename.split('.').pop()?.toLowerCase() ?? '';
}

async function toJpegBuffer(buffer, extension) {
  if (!HEIC_EXTENSIONS.includes(extension)) return buffer;

  try {
    return Buffer.from(await convert({ buffer, format: 'JPEG', quality: 1 }));
  } catch (cause) {
    const error = new Error('Échec de la conversion HEIC/HEIF.', { cause });
    error.code = 'HEIC_CONVERSION_FAILED';
    throw error;
  }
}

export async function normalizeImage(buffer, filename) {
  const extension = getExtension(filename);
  if (!ALLOWED_IMAGE_EXTENSIONS.includes(extension)) {
    const error = new Error(`Extension non supportée : .${extension || '?'}`);
    error.code = 'UNSUPPORTED_FORMAT';
    throw error;
  }

  const jpegBuffer = await toJpegBuffer(buffer, extension);

  return sharp(jpegBuffer)
    .rotate() // applique l'orientation EXIF (photos de téléphone) avant resize
    .resize({
      width: MAX_IMAGE_DIMENSION,
      height: MAX_IMAGE_DIMENSION,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer();
}
