// Le verrou global empêche N membres distincts de lancer N workers
// Tesseract simultanément (le cooldown par utilisateur ne couvre pas ce
// cas). Le point critique est la libération du verrou : s'il restait
// bloqué après une erreur, /score serait définitivement HS.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withOcrLock } from '../../src/score/withOcrLock.js';

test('exécute la tâche et renvoie son résultat quand le verrou est libre', async () => {
  const outcome = await withOcrLock(async () => 'scores');
  assert.deepEqual(outcome, { busy: false, result: 'scores' });
});

test('refuse sans exécuter la tâche quand un OCR est déjà en cours', async () => {
  let releaseFirst;
  const firstDone = new Promise((resolve) => {
    releaseFirst = resolve;
  });

  let secondTaskRan = false;
  const first = withOcrLock(() => firstDone);
  const second = await withOcrLock(async () => {
    secondTaskRan = true;
  });

  assert.deepEqual(second, { busy: true });
  assert.equal(secondTaskRan, false, 'la tâche refusée ne doit jamais être exécutée');

  releaseFirst('ok');
  await first;
});

test('libère le verrou même si la tâche lève une erreur', async () => {
  await assert.rejects(() =>
    withOcrLock(async () => {
      throw new Error('OCR planté');
    })
  );

  const outcome = await withOcrLock(async () => 'de nouveau disponible');
  assert.deepEqual(outcome, { busy: false, result: 'de nouveau disponible' }, 'le verrou doit être libéré');
});

test('libère le verrou après une exécution normale', async () => {
  await withOcrLock(async () => 'premier');
  const outcome = await withOcrLock(async () => 'second');
  assert.deepEqual(outcome, { busy: false, result: 'second' });
});
