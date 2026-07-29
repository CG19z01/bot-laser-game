function normalizeRoleToken(raw) {
  const mentionMatch = raw.match(/^<@&(\d+)>$/);
  if (mentionMatch) return { id: mentionMatch[1] };
  return { name: raw.startsWith('@') ? raw.slice(1) : raw };
}

export function resolveRolesByNames(guild, names) {
  return names.map((raw) => {
    const token = normalizeRoleToken(raw);
    const role = token.id
      ? guild.roles.cache.get(token.id)
      : guild.roles.cache.find((r) => r.name === token.name);
    return { raw, role };
  });
}
