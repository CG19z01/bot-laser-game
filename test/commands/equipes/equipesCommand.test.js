import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shuffle, buildTeams } from '../../../src/commands/equipes/equipesCommand.js';

test('shuffle conserve tous les éléments (même multi-ensemble)', () => {
  const input = ['a', 'b', 'c', 'd', 'e'];
  const result = shuffle(input);
  assert.deepEqual([...result].sort(), [...input].sort());
});

test('shuffle ne modifie pas le tableau d\'origine', () => {
  const input = ['a', 'b', 'c'];
  const copy = [...input];
  shuffle(input);
  assert.deepEqual(input, copy);
});

test('shuffle gère un tableau vide ou à un élément', () => {
  assert.deepEqual(shuffle([]), []);
  assert.deepEqual(shuffle(['solo']), ['solo']);
});

test('buildTeams répartit tous les joueurs sans perte ni doublon', () => {
  const names = Array.from({ length: 11 }, (_, i) => `joueur${i}`);
  const teams = buildTeams(names, 3);
  const flattened = teams.flat();
  assert.equal(flattened.length, names.length);
  assert.deepEqual([...flattened].sort(), [...names].sort());
});

test('buildTeams crée exactement le nombre d\'équipes demandé', () => {
  const names = Array.from({ length: 10 }, (_, i) => `j${i}`);
  const teams = buildTeams(names, 4);
  assert.equal(teams.length, 4);
});

test('buildTeams équilibre les tailles (écart maximum de 1)', () => {
  const names = Array.from({ length: 10 }, (_, i) => `j${i}`);
  const teams = buildTeams(names, 3);
  const sizes = teams.map((t) => t.length);
  assert.ok(Math.max(...sizes) - Math.min(...sizes) <= 1, `tailles déséquilibrées: ${sizes}`);
});
