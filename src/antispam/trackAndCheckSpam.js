const recentMessages = new Map();

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
