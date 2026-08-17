// Convertit un horodatage SQLite (« 2026-08-17 15:52:15 », toujours en UTC)
// en balise de date Discord, qui s'affiche dans le fuseau et la langue de
// chaque lecteur.
//
// Sans ça, le bot affichait l'heure UTC brute : une feuille scannée à 17h52
// heure française apparaissait « 15:52:15 », ce qui laissait croire à une
// erreur d'enregistrement.

export function discordTimestamp(sqliteUtc) {
  const parsed = Date.parse(`${String(sqliteUtc).replace(' ', 'T')}Z`);
  if (Number.isNaN(parsed)) return String(sqliteUtc);
  return `<t:${Math.floor(parsed / 1000)}:f>`;
}
