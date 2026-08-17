// Les horodatages SQLite sont en UTC ; sans conversion, une feuille scannée
// à 17h52 heure française s'affichait « 15:52:15 ».

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { discordTimestamp } from '../../src/score/discordTimestamp.js';

test('convertit un horodatage SQLite en balise Discord', () => {
  const attendu = Math.floor(Date.UTC(2026, 7, 17, 15, 52, 15) / 1000);
  assert.equal(discordTimestamp('2026-08-17 15:52:15'), `<t:${attendu}:f>`);
});

test('interprète bien la valeur comme de l\'UTC, pas comme une heure locale', () => {
  const seconds = Number(discordTimestamp('2026-01-01 00:00:00').match(/<t:(\d+):/)[1]);
  assert.equal(new Date(seconds * 1000).toISOString(), '2026-01-01T00:00:00.000Z');
});

test('renvoie la valeur brute si elle est inexploitable', () => {
  assert.equal(discordTimestamp('pas une date'), 'pas une date');
  assert.equal(discordTimestamp(null), 'null');
});
