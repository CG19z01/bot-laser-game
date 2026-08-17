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

// /score est ouverte à tous et lance un worker Tesseract (coûteux en RAM
// et en CPU) : sans limite, un spam suffirait à saturer le process, qui
// gère aussi l'anti-spam et les réactions. Un membre ayant plusieurs
// rôles bénéficie du délai le plus court (voir checkScoreCooldown.js).
export const SCORE_COOLDOWNS = [
  { roles: ['Administrateur', 'STAFF'], cooldownMs: 0 },
  { roles: ['Référant'], cooldownMs: 10_000 },
];
export const DEFAULT_SCORE_COOLDOWN_MS = 60_000;
