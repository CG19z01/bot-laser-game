// Verrou global : un seul OCR à la fois pour tout le bot. Le cooldown par
// utilisateur n'empêche pas N membres distincts de lancer N workers
// Tesseract simultanément — c'est ce cumul qui sature la mémoire du
// process (mono-thread, il gère aussi l'anti-spam et les réactions).

let busy = false;

// Retourne { busy: true } sans exécuter `task` si un OCR est déjà en
// cours, sinon { busy: false, result }. Le verrou est toujours libéré,
// y compris si `task` lève.
export async function withOcrLock(task) {
  if (busy) return { busy: true };

  busy = true;
  try {
    return { busy: false, result: await task() };
  } finally {
    busy = false;
  }
}
