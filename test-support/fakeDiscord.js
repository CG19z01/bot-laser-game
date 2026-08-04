// Fabriques d'objets discord.js minimalistes pour les tests unitaires —
// reproduisent uniquement la forme utilisée par le code testé (pas de
// dépendance à discord.js). Partagées entre plusieurs fichiers de test
// pour éviter de dupliquer ces mocks.

export function fakeMember(roleNames) {
  const roles = roleNames.map((name) => ({ name }));
  return { roles: { cache: { some: (fn) => roles.some(fn) } } };
}

export function fakeInteraction({ roleNames = [], deferred = false } = {}) {
  const calls = { reply: [], editReply: [] };
  return {
    deferred,
    member: fakeMember(roleNames),
    reply: async (opts) => calls.reply.push(opts),
    editReply: async (opts) => calls.editReply.push(opts),
    calls,
  };
}

export function fakeOverwrite(id, { allow = [], deny = [] } = {}) {
  return { id, allow: { toArray: () => allow }, deny: { toArray: () => deny } };
}

function cacheOf(items) {
  const map = new Map(items.map((item) => [item.id, item]));
  map.find = (fn) => items.find(fn);
  return map;
}

export function fakeGuild({ roles = [], channels = [] } = {}) {
  return {
    roles: { cache: cacheOf(roles) },
    channels: { cache: cacheOf(channels) },
  };
}
