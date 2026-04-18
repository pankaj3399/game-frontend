import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  normalizeTournamentMemberPair,
  parseCommittedMemberCount,
  takeDigits,
} from "@/pages/tournaments/components/create-modal/tournamentMemberCountUtils";

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
        const raw =
          role === "min"
            ? { minMember: self, maxMember: peerValue }
            : { minMember: peerValue, maxMember: self };

        if (raw.minMember > raw.maxMember) {
          onCommitPair(raw);
          setText(takeDigits(e.currentTarget.value));
          return;
        }

        const pair = normalizeTournamentMemberPair(raw.minMember, raw.maxMember);
        onCommitPair(pair);
        setText(String(role === "min" ? pair.minMember : pair.maxMember));
      }}
      className={className}
    />
  );
}
