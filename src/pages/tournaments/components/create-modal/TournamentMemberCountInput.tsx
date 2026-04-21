import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  applyTournamentMemberCountCommit,
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
  const textRef = useRef(text);
  const valueRef = useRef(value);
  const peerValueRef = useRef(peerValue);
  const roleRef = useRef(role);
  const onCommitPairRef = useRef(onCommitPair);
  const committedRef = useRef(false);
  const editedAfterSyncRef = useRef(false);

  useLayoutEffect(() => {
    textRef.current = text;
    valueRef.current = value;
    peerValueRef.current = peerValue;
    roleRef.current = role;
    onCommitPairRef.current = onCommitPair;
  }, [text, value, peerValue, role, onCommitPair]);

  useEffect(() => {
    committedRef.current = false;
    editedAfterSyncRef.current = false;
  }, [value]);

  return (
    <Input
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      aria-labelledby={ariaLabelledBy}
      value={text}
      onFocus={() => {
        committedRef.current = false;
        setText(String(value));
      }}
      onChange={(e) => {
        committedRef.current = false;
        editedAfterSyncRef.current = true;
        setText(takeDigits(e.target.value));
      }}
      onBlur={(e) => {
        if (!editedAfterSyncRef.current) {
          return;
        }
        if (committedRef.current) {
          return;
        }
        const normalizedDraft = parseCommittedMemberCount(e.currentTarget.value);
        if (normalizedDraft === valueRef.current) {
          setText(String(normalizedDraft));
          return;
        }
        committedRef.current = true;
        setText(
          applyTournamentMemberCountCommit(
            e.currentTarget.value,
            role,
            peerValue,
            onCommitPair
          )
        );
      }}
      className={className}
    />
  );
}
