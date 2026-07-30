// Constantes partagées par imageProcessor.js, scoreExtractor.js et scoreCommand.js
// pour la fonctionnalité d'extraction de scores depuis une photo de feuille de résultats.

export const OCR_LANGUAGE = 'eng'; // suffit pour reconnaître des chiffres imprimés

// Redimensionnement avant OCR : une résolution trop faible dégrade la
// reconnaissance, trop élevée ralentit Tesseract sans gain de précision.
export const MAX_IMAGE_DIMENSION = 2000;
export const JPEG_QUALITY = 85;

export const HEIC_EXTENSIONS = ['heic', 'heif'];
export const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', ...HEIC_EXTENSIONS];

export const SCORE_ZONES = ['pistolet', 'plastron', 'epaules', 'dos'];
