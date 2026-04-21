export const AVATAR_TONES = [
  "from-[#f7d4bf] to-[#efb598]",
  "from-[#d5e5f6] to-[#acc8e7]",
  "from-[#d9efdd] to-[#b9dfc4]",
  "from-[#f7e5bb] to-[#efd587]",
  "from-[#e8ddfb] to-[#cab6ef]",
  "from-[#ffd8e0] to-[#f4b3c2]",
];

export function hashSeed(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (Math.imul(hash, 31) + value.charCodeAt(index)) | 0;
  }
  return (hash >>> 0) % 2147483647;
}

/** Two-letter initials from a display name (first + last token). */
export function initialsFromName(name: string): string {
  const tokens = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (tokens.length === 0) {
    return "?";
  }

  const first = tokens[0][0] ?? "";
  const second = tokens.length > 1 ? tokens[tokens.length - 1][0] ?? "" : "";
  return `${first}${second}`.toUpperCase();
}

export function avatarToneClass(seed: string): string {
  return AVATAR_TONES[hashSeed(seed) % AVATAR_TONES.length] ?? AVATAR_TONES[0];
}
