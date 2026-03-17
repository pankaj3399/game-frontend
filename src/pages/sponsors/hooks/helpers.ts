export function requireClubId(clubId: string | null): string {
  if (!clubId) throw new Error("clubId is required for sponsor mutations");
  return clubId;
}
