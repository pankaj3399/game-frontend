export type NameAliasFields = {
  name: string | null;
  alias: string | null;
};

/** Display label for a participant row (matches tab, schedule cards, etc.). */
export function displayTournamentNameAlias(
  entity: NameAliasFields | null,
  fallback: string
): string {
  if (!entity) {
    return fallback;
  }
  const trimmedName = entity.name?.trim();
  const trimmedAlias = entity.alias?.trim();
  return trimmedName || trimmedAlias || fallback;
}
