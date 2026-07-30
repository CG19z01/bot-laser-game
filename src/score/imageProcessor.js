// Normalise n'importe quel format d'attachment Discord (iOS .heic/.heif,
// Android .jpg/.png/.webp) en un buffer JPEG redimensionné prêt à envoyer à
// l'API Anthropic. Séparé de scoreExtractor.js car c'est une transformation
// d'image pure, sans dépendance à l'API — testable et remplaçable seule.

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
    .grayscale()
    .normalize() // améliore le contraste pour aider Tesseract à distinguer les chiffres
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer();
}
