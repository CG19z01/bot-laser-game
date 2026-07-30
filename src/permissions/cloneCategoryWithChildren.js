// Duplique une catégorie et tous ses salons enfants (triés par position),
// en laissant l'appelant décider des permissions de chaque salon cloné via
// `getOverwrites(channel)` — appelée une fois pour la catégorie elle-même,
// puis une fois par salon enfant. Partagé par /copie-cat (permissions
// fixes, même overwrites pour tous les salons) et /nouvelle-promo
// (overwrites recalculées par salon, rôle transposé).
export async function cloneCategoryWithChildren(source, newName, getOverwrites) {
  const newCategory = await source.clone({ name: newName, permissionOverwrites: getOverwrites(source) });

  const children = [...source.children.cache.values()].sort((a, b) => a.position - b.position);
  for (const child of children) {
    const clone = await child.clone({ name: child.name, permissionOverwrites: getOverwrites(child) });
    await clone.setParent(newCategory.id, { lockPermissions: false });
  }

  return children;
}
