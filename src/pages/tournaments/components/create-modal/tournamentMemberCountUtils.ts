/** Matches `memberCountSchema` minimum; upper bound is a practical UI cap only. */
export const TOURNAMENT_MEMBER_COUNT_MIN = 1;
export const TOURNAMENT_MEMBER_COUNT_MAX = 999;

const MAX_DIGITS = String(TOURNAMENT_MEMBER_COUNT_MAX).length;

export function takeDigits(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, MAX_DIGITS);
}

export function parseCommittedMemberCount(raw: string): number {
  const digits = takeDigits(raw);
  if (digits === "") {
    return TOURNAMENT_MEMBER_COUNT_MIN;
  }
  const n = Number.parseInt(digits, 10);
  if (!Number.isFinite(n)) {
    return TOURNAMENT_MEMBER_COUNT_MIN;
  }
  return Math.min(TOURNAMENT_MEMBER_COUNT_MAX, Math.max(TOURNAMENT_MEMBER_COUNT_MIN, n));
}

/** Same ordering rule as `normalizeMemberRange` in tournament types. */
export function normalizeTournamentMemberPair(
  minMember: number,
  maxMember: number,
): { minMember: number; maxMember: number } {
  const lo = Math.min(minMember, maxMember);
  const hi = Math.max(minMember, maxMember);
  return { minMember: lo, maxMember: hi };
}
