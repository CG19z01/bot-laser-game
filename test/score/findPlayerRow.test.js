// Le rattachement d'une feuille au bon joueur repose entièrement sur cette
// correspondance : une erreur ici enregistrerait les stats sur quelqu'un
// d'autre. On teste donc surtout ce qui NE doit PAS correspondre.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findPlayerRow } from '../../src/score/findPlayerRow.js';

const NAMES = ['JAUNE', 'Neriel oo', 'TOTO N', 'ROUGE', 'Smilke', 'Auré', 'BLEUE', 'ILVANDEWSKI', 'BASCISKIN'];

test('trouve le joueur par correspondance exacte', () => {
  assert.equal(findPlayerRow(NAMES, 'Smilke'), 4);
});

test('tolère la casse et les accents perdus par l\'OCR', () => {
  assert.equal(findPlayerRow(NAMES, 'AURE'), 5);
  assert.equal(findPlayerRow(NAMES, 'ilvandewski'), 7);
});

test('tolère les caractères parasites collés par l\'OCR', () => {
  // L'OCR rend réellement « Neriel » en « Neriel oo » et « TOTO » en
  // « TOTO N » sur la feuille de référence : ces cas doivent correspondre.
  assert.equal(findPlayerRow(NAMES, 'Neriel'), 1);
  assert.equal(findPlayerRow(NAMES, 'TOTO'), 2);
});

test('refuse un pseudo trop éloigné, même partiellement commun', () => {
  assert.equal(findPlayerRow(NAMES, 'Smilkovitch'), -1);
  assert.equal(findPlayerRow(['BASCISKIN'], 'BASC'), -1);
});

test('renvoie -1 quand le pseudo est absent', () => {
  assert.equal(findPlayerRow(NAMES, 'Inconnu'), -1);
});

test('ne confond pas deux pseudos proches', () => {
  assert.equal(findPlayerRow(['BASCISKIN', 'BASCISKIM'], 'BASCISKIN'), 0);
});

test('refuse un pseudo vide ou trop court', () => {
  assert.equal(findPlayerRow(NAMES, ''), -1);
  assert.equal(findPlayerRow(NAMES, 'S'), -1);
  assert.equal(findPlayerRow(NAMES, null), -1);
});

test('ignore les lignes d\'en-tête d\'équipe', () => {
  // « ROUGE » est un nom d'équipe, jamais un joueur : il ne doit être
  // trouvé que si on le cherche explicitement, pas par approximation.
  assert.equal(findPlayerRow(NAMES, 'ROUGF'), 3, 'une faute d\'OCR sur ROUGE reste tolérée');
  assert.equal(findPlayerRow(NAMES, 'Smilke'), 4, 'le vrai joueur reste prioritaire');
});
