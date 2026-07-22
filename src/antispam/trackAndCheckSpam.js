const recentMessages = new Map();
const MAX_TRACKED_AGE_MS = 300_000;

setInterval(() => {
  const now = Date.now();
  for (const [key, messages] of recentMessages) {
    const lastMessage = messages[messages.length - 1];
    if (now - lastMessage.createdTimestamp > MAX_TRACKED_AGE_MS) {
      recentMessages.delete(key);
    }
  }
}, MAX_TRACKED_AGE_MS).unref();

export function trackAndCheckSpam(message, maxMessages, windowSeconds) {
  const key = `${message.guild.id}:${message.channel.id}:${message.author.id}`;
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  const messages = (recentMessages.get(key) ?? []).filter(
    (m) => now - m.createdTimestamp < windowMs
  );
  messages.push(message);

  if (messages.length > maxMessages) {
    recentMessages.delete(key);
    return messages;
  }

  recentMessages.set(key, messages);
  return null;
}
