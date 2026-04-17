import { useState } from "react";
import { Input } from "@/components/ui/input";

/** Matches `totalRoundsSchema` in `@/models/tournament/types`. */
export const TOTAL_ROUNDS_MIN = 1;
export const TOTAL_ROUNDS_MAX = 100;
const MAX_INPUT_DIGITS = String(TOTAL_ROUNDS_MAX).length;

function takeDigits(raw: string): string {
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

export interface TournamentTotalRoundsInputProps {
  id: string;
  /** Last committed value from form state; also used with `formScopeKey` as React `key` by the parent. */
  value: number;
  onCommit: (next: number) => void;
  "aria-labelledby"?: string;
  className?: string;
}

/**
 * Text field for 1–100 rounds: keeps raw digits while focused and commits a clamped integer on blur.
 * Parent should set `key={\`${formScopeKey}-${value}\`}` so the field remounts when the committed value
 * or form identity changes (no `useEffect` sync needed).
 */
export function TournamentTotalRoundsInput({
  id,
  value,
  onCommit,
  "aria-labelledby": ariaLabelledBy,
  className,
}: TournamentTotalRoundsInputProps) {
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
        const next = parseCommittedTotalRounds(e.currentTarget.value);
        setText(String(next));
        onCommit(next);
      }}
      className={className}
    />
  );
}
