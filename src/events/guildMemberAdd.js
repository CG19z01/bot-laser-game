import { Events } from 'discord.js';
import { getAutoroleRoleId } from '../db/autorole/getAutoroleRoleId.js';

export default {
  name: Events.GuildMemberAdd,
  async execute(member) {
    const roleId = getAutoroleRoleId(member.guild.id);
    if (!roleId) return;

    try {
      await member.roles.add(roleId);
    } catch (error) {
      console.error(
        `[autorole] Impossible d'attribuer le rôle ${roleId} sur ${member.guild.name}:`,
        error.message
      );
    }
  },
};
