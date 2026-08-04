// Sécurité : normalizeImage() ne doit traiter que les extensions listées
// dans ALLOWED_IMAGE_EXTENSIONS. Une extension refusée doit être rejetée
// avant tout traitement du contenu du buffer (aucun appel à sharp/heic-convert).

import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { normalizeImage } from '../../src/score/imageProcessor.js';

let tinyJpeg;

before(async () => {
  tinyJpeg = await sharp({ create: { width: 4, height: 4, channels: 3, background: 'white' } })
    .jpeg()
    .toBuffer();
});

test('rejette une extension non supportée, sans jamais traiter le contenu', async () => {
  // Buffer volontairement invalide : si le rejet dépendait du contenu
  // plutôt que de l'extension, sharp planterait avant notre propre erreur.
  const garbage = Buffer.from('pas une image');
  await assert.rejects(() => normalizeImage(garbage, 'malware.exe'), (error) => {
    assert.equal(error.code, 'UNSUPPORTED_FORMAT');
    return true;
  });
});

test('rejette un fichier sans extension', async () => {
  await assert.rejects(() => normalizeImage(Buffer.from('data'), 'sansextension'), (error) => {
    assert.equal(error.code, 'UNSUPPORTED_FORMAT');
    return true;
  });
});

test('extension insensible à la casse (.JPG accepté comme .jpg)', async () => {
  const result = await normalizeImage(tinyJpeg, 'PHOTO.JPG');
  assert.ok(Buffer.isBuffer(result));
});

test('accepte tous les formats listés dans ALLOWED_IMAGE_EXTENSIONS (hors HEIC/HEIF)', async () => {
  for (const ext of ['jpg', 'jpeg', 'png', 'webp']) {
    const result = await normalizeImage(tinyJpeg, `photo.${ext}`);
    assert.ok(Buffer.isBuffer(result), `devrait accepter .${ext}`);
  }
});

test('échec de conversion HEIC renvoyé comme erreur applicative, pas un crash', async () => {
  const notReallyHeic = Buffer.from('pas un vrai fichier HEIC');
  await assert.rejects(() => normalizeImage(notReallyHeic, 'photo.heic'), (error) => {
    assert.equal(error.code, 'HEIC_CONVERSION_FAILED');
    return true;
  });
});
