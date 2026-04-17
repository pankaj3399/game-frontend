import { useState } from "react";
import { Input } from "@/components/ui/input";

/** Matches `memberCountSchema` minimum; upper bound is a practical UI cap only. */
export const TOURNAMENT_MEMBER_COUNT_MIN = 1;
export const TOURNAMENT_MEMBER_COUNT_MAX = 999;
const MAX_DIGITS = String(TOURNAMENT_MEMBER_COUNT_MAX).length;

function takeDigits(raw: string): string {
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

export interface TournamentMemberCountInputProps {
  id: string;
  /** This field’s committed value from form state. */
  value: number;
  /** The other field’s committed value, used when normalizing the pair on blur. */
  peerValue: number;
  role: "min" | "max";
  onCommitPair: (next: { minMember: number; maxMember: number }) => void;
  "aria-labelledby"?: string;
  className?: string;
}

/**
 * Integer min/max player count field: free typing while focused, commits a normalized
 * `{ minMember, maxMember }` pair on blur. Parent should set `key={\`${formScopeKey}-${role}-${value}\`}`
 * so the draft resets when the committed value changes from outside.
 */
export function TournamentMemberCountInput({
  id,
  value,
  peerValue,
  role,
  onCommitPair,
  "aria-labelledby": ariaLabelledBy,
  className,
}: TournamentMemberCountInputProps) {
  const [text, setText] = useState(() => String(value));

  return (
    <Input
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      aria-labelledby={ariaLabelledBy}
      value={text}
      onFocus={() => {
        setText(String(value));
      }}
      onChange={(e) => {
        setText(takeDigits(e.target.value));
      }}
      onBlur={(e) => {
        const self = parseCommittedMemberCount(e.currentTarget.value);
        const pair =
          role === "min"
            ? normalizeTournamentMemberPair(self, peerValue)
            : normalizeTournamentMemberPair(peerValue, self);
        onCommitPair(pair);
        setText(String(role === "min" ? pair.minMember : pair.maxMember));
      }}
      className={className}
    />
  );
}
