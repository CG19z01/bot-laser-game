// Retrouve la structure des tableaux sur une feuille recadrée et redressée :
// les rangées (bandes entre deux traits horizontaux) et les colonnes,
// regroupées par tableau.
//
// Deux pièges traités ici :
//  - un séparateur dérive de quelques pixels d'une rangée à l'autre, donc on
//    regroupe avant de compter les votes, jamais l'inverse ;
//  - l'espace entre deux tableaux (~33px) est plus étroit qu'une colonne
//    (67-276px) : impossible de les distinguer par la largeur. On teste
//    plutôt si le trait horizontal traverse l'intervalle — il s'interrompt
//    entre deux tableaux, qui sont des encadrés séparés.

import sharp from 'sharp';
import { DARK_PIXEL_THRESHOLD, LINE_MAX_GAP } from '../config/scoreConfig.js';

const MIN_ROW_HEIGHT = 8;
const TABLE_ZONE_GAP = 150;
const SEPARATOR_TOLERANCE = 6;

function longestRun(isSet, length) {
  let best = 0;
  let current = 0;
  let gap = 0;
  for (let i = 0; i < length; i++) {
    if (isSet(i)) {
      current += gap + 1;
      gap = 0;
      if (current > best) best = current;
    } else if (++gap > LINE_MAX_GAP) {
      current = 0;
      gap = 0;
    }
  }
  return best;
}

function cluster(indices, tolerance) {
  const groups = [];
  for (const index of [...indices].sort((a, b) => a - b)) {
    const last = groups[groups.length - 1];
    if (last && index - last[last.length - 1] <= tolerance) last.push(index);
    else groups.push([index]);
  }
  return groups;
}

const average = (group) => Math.round(group.reduce((a, b) => a + b) / group.length);

function findHorizontalLines(isDark, width, height) {
  const candidates = [];
  for (let y = 0; y < height; y++) {
    if (longestRun((x) => isDark(x, y), width) > width * 0.15) candidates.push(y);
  }
  const lines = cluster(candidates, 5).map(average);

  // Les tableaux de données sont en haut ; le tableau « Equipes » et le
  // graphique, bien plus bas, sont séparés par une grande zone vide.
  const breakIndex = lines.findIndex((y, i) => i > 0 && y - lines[i - 1] > TABLE_ZONE_GAP);
  return breakIndex > 0 ? lines.slice(0, breakIndex) : lines;
}

// Le balayage évite les traits horizontaux qui bornent la rangée, sinon
// chaque colonne compterait ces pixels comme sombres.
function separatorsForRow(isDark, width, { y0, y1 }) {
  const top = y0 + 2;
  const bottom = y1 - 2;
  const height = bottom - top;
  const candidates = [];
  for (let x = 0; x < width; x++) {
    let dark = 0;
    for (let y = top; y <= bottom; y++) if (isDark(x, y)) dark++;
    if (dark > height * 0.75) candidates.push(x);
  }
  return cluster(candidates, 5).map(average);
}

// Un séparateur n'est retenu que s'il apparaît sur la moitié des rangées :
// le texte dense d'une cellule peut imiter un trait sur une rangée isolée.
function consensusSeparators(isDark, width, rows) {
  const all = rows.flatMap((row) => separatorsForRow(isDark, width, row));
  return cluster(all, SEPARATOR_TOLERANCE)
    .filter((group) => group.length >= Math.ceil(rows.length * 0.5))
    .map(average);
}

// Entre deux encadrés, le trait horizontal s'interrompt : si aucun des traits
// ne couvre l'intervalle, c'est un espace inter-tableaux, pas une colonne.
function isRealColumn(isDark, borders, xa, xb) {
  const span = xb - xa;
  if (span < 4) return false;
  return borders.some((y) => {
    let dark = 0;
    for (let x = xa + 2; x < xb - 2; x++) {
      if (isDark(x, y) || isDark(x, y - 1) || isDark(x, y + 1)) dark++;
    }
    return dark > (span - 4) * 0.8;
  });
}

function groupIntoTables(isDark, borders, separators) {
  const tables = [];
  let current = [];
  for (let i = 0; i < separators.length - 1; i++) {
    if (isRealColumn(isDark, borders, separators[i], separators[i + 1])) {
      if (current.length === 0) current.push(separators[i]);
      current.push(separators[i + 1]);
    } else if (current.length > 0) {
      tables.push(current);
      current = [];
    }
  }
  if (current.length > 0) tables.push(current);
  return tables.filter((t) => t.length >= 2);
}

export async function detectGrid(buffer) {
  const { data, info } = await sharp(buffer).grayscale().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const isDark = (x, y) => y >= 0 && y < height && data[y * width + x] < DARK_PIXEL_THRESHOLD;

  // Les rangées sont bornées par les traits eux-mêmes : c'est readCellDigits
  // qui écarte ensuite la marge nécessaire. Retrancher la marge ici aussi
  // rognerait le haut et le bas des chiffres.
  const borders = findHorizontalLines(isDark, width, height);
  const rows = [];
  for (let i = 0; i < borders.length - 1; i++) {
    if (borders[i + 1] - borders[i] >= MIN_ROW_HEIGHT) {
      rows.push({ y0: borders[i], y1: borders[i + 1] });
    }
  }

  if (rows.length === 0) {
    const error = new Error('Aucun tableau détecté sur la feuille.');
    error.code = 'GRID_NOT_FOUND';
    throw error;
  }

  const separators = consensusSeparators(isDark, width, rows);
  return { rows, tables: groupIntoTables(isDark, borders, separators) };
}
