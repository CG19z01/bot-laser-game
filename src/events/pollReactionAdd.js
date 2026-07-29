import { Events } from 'discord.js';
import { getPoll } from '../db/polls/getPoll.js';
import { closePoll } from '../db/polls/closePoll.js';
import { DATE_EMOJIS } from '../polls/dateEmojis.js';
import { sendLog } from '../logs/sendLog.js';

export default {
  name: Events.MessageReactionAdd,
  async execute(reaction, user) {
    if (user.bot) return;
    if (reaction.partial) await reaction.fetch();

    const poll = getPoll(reaction.message.id);
    if (!poll || poll.closed) return;

    const message = reaction.message.partial ? await reaction.message.fetch() : reaction.message;

    let total = 0;
    let winningIndex = 0;
    let winningCount = -1;

    poll.dates.forEach((_, i) => {
      const count = (message.reactions.cache.get(DATE_EMOJIS[i])?.count ?? 1) - 1;
      total += count;
      if (count > winningCount) {
        winningCount = count;
        winningIndex = i;
      }
    });

    if (total < poll.threshold) return;

    closePoll(message.id);

    await message.edit({
      content: `${message.content}\n\n🔒 **Sondage clos** — date retenue : ${poll.dates[winningIndex]}`,
      allowedMentions: { parse: [] },
    });

    const adminChannel = await message.client.channels.fetch(message.client.env.adminChannelId);
    await adminChannel.send(
      `Sondage clos dans <#${poll.channelId}> — date retenue : **${poll.dates[winningIndex]}** (${total} réactions).`
    );

    await sendLog(
      message.client,
      `🔒 Sondage clos dans <#${poll.channelId}> — date retenue : ${poll.dates[winningIndex]} (${total} réactions).`
    );
  },
};
