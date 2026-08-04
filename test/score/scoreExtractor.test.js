import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractNumbersInReadingOrder } from '../../src/score/scoreExtractor.js';

function word(text, y0, x0) {
  return { text, bbox: { y0, x0, y1: y0 + 10, x1: x0 + 10 } };
}

test('trie les nombres dans l\'ordre de lecture (haut->bas, gauche->droite)', () => {
  const words = [
    word('5', 40, 200),
    word('Pistolet', 20, 10),
    word('3', 20, 100),
    word('1', 60, 100),
  ];
  assert.deepEqual(extractNumbersInReadingOrder(words), [3, 5, 1]);
});

test('ignore les mots non numériques', () => {
  const words = [word('Pistolet', 0, 0), word('Plastron', 10, 0), word('12', 20, 0)];
  assert.deepEqual(extractNumbersInReadingOrder(words), [12]);
});

test('tolère les espaces autour du texte', () => {
  assert.deepEqual(extractNumbersInReadingOrder([word('  7  ', 0, 0)]), [7]);
});

test('tableau vide -> aucun nombre', () => {
  assert.deepEqual(extractNumbersInReadingOrder([]), []);
});

test('rejette un nombre collé à du texte (ex: "12h")', () => {
  assert.deepEqual(extractNumbersInReadingOrder([word('12h', 0, 0)]), []);
});

// Documente une limite connue (voir README) : un nombre parasite plus haut
// sur la page (date, numéro de page...) décale tout le mapping positionnel
// sans être détecté — d'où la vérification humaine via /edit-score.
test('limite connue : un nombre parasite plus haut sur la page décale le mapping', () => {
  const words = [
    word('2026', 5, 300), // ex: une date en haut de la feuille
    word('3', 20, 100),
    word('1', 40, 100),
  ];
  const result = extractNumbersInReadingOrder(words);
  assert.deepEqual(result, [2026, 3, 1]);
  assert.notDeepEqual(result, [3, 1]);
});
