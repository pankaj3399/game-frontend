import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  parseCommittedTotalRounds,
  takeDigits,
} from "@/pages/tournaments/components/create-modal/TournamentTotalRoundsInput.constants";

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
