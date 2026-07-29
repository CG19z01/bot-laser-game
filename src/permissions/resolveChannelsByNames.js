function normalizeChannelToken(raw) {
  const mentionMatch = raw.match(/^<#(\d+)>$/);
  if (mentionMatch) return { id: mentionMatch[1] };
  return { name: raw.startsWith('#') ? raw.slice(1) : raw };
}

export function resolveChannelsByNames(guild, names) {
  return names.map((raw) => {
    const token = normalizeChannelToken(raw);
    const channel = token.id
      ? guild.channels.cache.get(token.id)
      : guild.channels.cache.find((c) => c.name === token.name);
    return { raw, channel };
  });
}
