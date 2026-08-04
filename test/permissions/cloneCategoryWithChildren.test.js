import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cloneCategoryWithChildren } from '../../src/permissions/cloneCategoryWithChildren.js';

function fakeCloneableChannel(name, position) {
  const calls = [];
  return {
    name,
    position,
    clone: async ({ name: cloneName, permissionOverwrites }) => {
      calls.push({ type: 'clone', cloneName, permissionOverwrites });
      return {
        id: `clone-of-${name}`,
        setParent: async (parentId, opts) => calls.push({ type: 'setParent', parentId, opts }),
      };
    },
    calls,
  };
}

test('clone la catégorie puis chaque salon, triés par position, avec le bon parent', async () => {
  const childB = fakeCloneableChannel('B', 2);
  const childA = fakeCloneableChannel('A', 1);
  const source = fakeCloneableChannel('Source', 0);
  // Ordre volontairement désordonné en entrée pour vérifier le tri.
  source.children = { cache: { values: () => [childB, childA][Symbol.iterator]() } };

  const getOverwrites = (channel) => [`overwrites-${channel.name}`];

  const children = await cloneCategoryWithChildren(source, 'NouvelleCategorie', getOverwrites);

  assert.deepEqual(children.map((c) => c.name), ['A', 'B'], 'doit être trié par position');
  assert.deepEqual(source.calls[0], {
    type: 'clone',
    cloneName: 'NouvelleCategorie',
    permissionOverwrites: ['overwrites-Source'],
  });
  assert.deepEqual(childA.calls[0].permissionOverwrites, ['overwrites-A']);
  assert.deepEqual(childB.calls[0].permissionOverwrites, ['overwrites-B']);
  assert.equal(childA.calls[1].parentId, 'clone-of-Source');
  assert.equal(childB.calls[1].parentId, 'clone-of-Source');
  assert.deepEqual(childA.calls[1].opts, { lockPermissions: false });
});

test('catégorie sans salon enfant -> aucune boucle, aucun crash', async () => {
  const source = fakeCloneableChannel('Vide', 0);
  source.children = { cache: { values: () => [][Symbol.iterator]() } };

  const children = await cloneCategoryWithChildren(source, 'Copie', () => []);
  assert.deepEqual(children, []);
});
