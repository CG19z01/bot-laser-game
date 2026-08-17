// Constantes partagées par le pipeline d'extraction de scores
// (imageProcessor -> cropToSheet -> deskewSheet -> detectGrid -> scoreExtractor)
// et par les commandes /score, /edit-score et /stats.

export const OCR_LANGUAGE = 'eng'; // suffit pour des chiffres et des pseudos latins

export const MAX_IMAGE_DIMENSION = 2000;
export const JPEG_QUALITY = 90;

export const HEIC_EXTENSIONS = ['heic', 'heif'];
export const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', ...HEIC_EXTENSIONS];

// Les 4 zones de capteurs, dans l'ordre des colonnes de la feuille
// (gauche -> droite). `key` sert aussi de suffixe de colonne en base.
export const SCORE_ZONES = [
  { key: 'av', label: 'Avant' },
  { key: 'ar', label: 'Arrière' },
  { key: 'ep', label: 'Épaules' },
  { key: 'pi', label: 'Pistolet' },
];

// --- Détection de la feuille et du quadrillage ---------------------------
// Largeur de travail : au-delà l'analyse ralentit sans gagner en précision,
// en deçà les traits fins du quadrillage disparaissent.
export const SHEET_WORK_WIDTH = 1600;
// La feuille est claire et peu saturée ; le fond (table, moquette) est
// typiquement plus sombre ou plus coloré.
export const SHEET_MIN_BRIGHTNESS = 90;
export const SHEET_MAX_SATURATION = 0.35;
// Marge rognée en plus des bords détectés, pour exclure l'ombre du bord.
export const SHEET_CROP_PADDING = 0.015;

export const DARK_PIXEL_THRESHOLD = 100;
// Un trait imprimé pâle peut être interrompu : on tolère quelques pixels clairs.
export const LINE_MAX_GAP = 3;
export const DESKEW_MAX_ANGLE = 3;
export const DESKEW_STEP = 0.25;

// Une cellule grisée (propre équipe du joueur) n'a jamais de valeur : on la
// saute au lieu de laisser l'OCR y voir un chiffre. Le seuil est un ratio
// par rapport au blanc de la feuille, pas une valeur absolue : sur photo, le
// papier « blanc » varie fortement selon l'éclairage. Mesuré : cellules
// normales entre 0,96 et 1,04 ; cellules grisées entre 0,77 et 0,83.
export const GREY_CELL_MAX_RATIO = 0.9;

// --- Limitation d'usage de /score ---------------------------------------
// L'OCR est coûteux en RAM et en CPU sur un process mono-thread qui gère
// aussi l'anti-spam et les réactions. Un membre cumulant plusieurs rôles
// bénéficie du délai le plus court (voir checkScoreCooldown.js).
export const SCORE_COOLDOWNS = [
  { roles: ['Administrateur', 'STAFF'], cooldownMs: 0 },
  { roles: ['Référant'], cooldownMs: 10_000 },
];
export const DEFAULT_SCORE_COOLDOWN_MS = 60_000;
