// Retrouve, dans la colonne des noms du tableau de gauche, la rangée du
// joueur propriétaire de la feuille. C'est cette rangée qui porte son
// Eff. Tir et son Score.
//
// La comparaison tolère les erreurs d'OCR (accents perdus, I/l/1 confondus,
// casse) : sans ça, « Auré » lu « Aure » ne correspondrait jamais.

const MAX_DISTANCE = 2;

function normalize(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function levenshtein(a, b) {
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + cost);
    }
    previous = current;
  }
  return previous[b.length];
}

// `names` est indexé comme les rangées : une entrée vide correspond à une
// ligne d'en-tête d'équipe, jamais à un joueur.
export function findPlayerRow(names, pseudo) {
  const target = normalize(pseudo ?? '');
  if (target.length < 2) return -1;

  let best = -1;
  let bestDistance = Infinity;

  for (let index = 0; index < names.length; index++) {
    const candidate = normalize(names[index] ?? '');
    if (candidate.length < 2) continue;

    const distance = levenshtein(candidate, target);
    const tolerance = Math.min(MAX_DISTANCE, Math.floor(target.length / 3));
    if (distance <= tolerance && distance < bestDistance) {
      bestDistance = distance;
      best = index;
    }
  }

  return best;
}
