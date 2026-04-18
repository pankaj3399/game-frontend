/** Matches `totalRoundsSchema` in `@/models/tournament/types`. */
export const TOTAL_ROUNDS_MIN = 1;
export const TOTAL_ROUNDS_MAX = 100;

const MAX_INPUT_DIGITS = String(TOTAL_ROUNDS_MAX).length;

export function takeDigits(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, MAX_INPUT_DIGITS);
}

export function parseCommittedTotalRounds(raw: string): number {
  const digits = takeDigits(raw);
  if (digits === "") {
    return TOTAL_ROUNDS_MIN;
  }
  const n = Number.parseInt(digits, 10);
  if (!Number.isFinite(n)) {
    return TOTAL_ROUNDS_MIN;
  }
  return Math.min(TOTAL_ROUNDS_MAX, Math.max(TOTAL_ROUNDS_MIN, n));
}
