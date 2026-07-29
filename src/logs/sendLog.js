export async function sendLog(client, content) {
  try {
    const channel = await client.channels.fetch(client.env.logChannelId);
    await channel.send({ content, allowedMentions: { parse: [] } });
  } catch (error) {
    console.error("[logs] Impossible d'envoyer le log:", error.message);
  }
}
