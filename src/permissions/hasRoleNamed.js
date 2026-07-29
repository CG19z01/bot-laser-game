export function hasRoleNamed(member, names) {
  return member.roles.cache.some((role) => names.includes(role.name));
}
