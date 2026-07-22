const CUSTOM_EMOJI_REGEX = /^<a?:\w+:(\d+)>$/;

export function normalizeEmoji(raw) {
  const match = raw.match(CUSTOM_EMOJI_REGEX);
  return match ? match[1] : raw;
}
