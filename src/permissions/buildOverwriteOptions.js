export function buildOverwriteOptions(overwrite) {
  const options = {};
  for (const flag of overwrite.allow.toArray()) options[flag] = true;
  for (const flag of overwrite.deny.toArray()) options[flag] = false;
  return options;
}
