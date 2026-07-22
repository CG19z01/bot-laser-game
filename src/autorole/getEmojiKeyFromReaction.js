export function getEmojiKeyFromReaction(reaction) {
  return reaction.emoji.id ?? reaction.emoji.name;
}
