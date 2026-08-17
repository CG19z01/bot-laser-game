// Seuil de binarisation calculé pour une image donnée (méthode d'Otsu) :
// on retient la valeur qui sépare le mieux les pixels en deux groupes,
// « encre » et « papier ».
//
// Indispensable ici parce que l'éclairage d'une photo n'est pas uniforme :
// un seuil fixe convenant au tableau du milieu transformait le tableau de
// droite, plus sombre, en aplat noir. Mesuré sur la feuille de référence :
// 36 cellules correctes sur 48 avec un seuil fixe, 47 avec Otsu.

export function otsuThreshold(pixels) {
  const histogram = new Array(256).fill(0);
  for (const value of pixels) histogram[value]++;

  const total = pixels.length;
  let weightedTotal = 0;
  for (let i = 0; i < 256; i++) weightedTotal += i * histogram[i];

  let backgroundWeight = 0;
  let backgroundSum = 0;
  let best = 0;
  let bestVariance = -1;

  for (let threshold = 0; threshold < 256; threshold++) {
    backgroundWeight += histogram[threshold];
    if (backgroundWeight === 0) continue;
    const foregroundWeight = total - backgroundWeight;
    if (foregroundWeight === 0) break;

    backgroundSum += threshold * histogram[threshold];
    const backgroundMean = backgroundSum / backgroundWeight;
    const foregroundMean = (weightedTotal - backgroundSum) / foregroundWeight;
    const variance =
      backgroundWeight * foregroundWeight * (backgroundMean - foregroundMean) ** 2;

    if (variance > bestVariance) {
      bestVariance = variance;
      best = threshold;
    }
  }

  return best;
}
