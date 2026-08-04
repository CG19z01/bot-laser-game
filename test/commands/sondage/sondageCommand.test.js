import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDates } from '../../../src/commands/sondage/sondageCommand.js';
import { DATE_EMOJIS } from '../../../src/polls/dateEmojis.js';

test('parse une seule date valide', () => {
  assert.deepEqual(parseDates('25/12/2026'), ['25/12/2026']);
});

test('parse plusieurs dates séparées par ";"', () => {
  assert.deepEqual(parseDates('25/12/2026;01/01/2027'), ['25/12/2026', '01/01/2027']);
});

test('tolère les espaces autour des dates et un ";" final', () => {
  assert.deepEqual(parseDates(' 25/12/2026 ; 01/01/2027 ;'), ['25/12/2026', '01/01/2027']);
});

test('rejette un format de date invalide', () => {
  assert.equal(parseDates('2026-12-25'), null);
  assert.equal(parseDates('25/12/26'), null);
  assert.equal(parseDates('n\'importe quoi'), null);
});

test('rejette si une seule date du lot est invalide', () => {
  assert.equal(parseDates('25/12/2026;pas-une-date'), null);
});

test(`accepte jusqu'à ${DATE_EMOJIS.length} dates (limite du nombre d'emojis)`, () => {
  const dates = Array.from({ length: DATE_EMOJIS.length }, (_, i) => `0${(i % 9) + 1}/01/2026`);
  assert.deepEqual(parseDates(dates.join(';')), dates);
});

test(`rejette au-delà de ${DATE_EMOJIS.length} dates`, () => {
  const dates = Array.from({ length: DATE_EMOJIS.length + 1 }, (_, i) => `0${(i % 9) + 1}/01/2026`);
  assert.equal(parseDates(dates.join(';')), null);
});

test('rejette une chaîne vide', () => {
  assert.equal(parseDates(''), null);
});
