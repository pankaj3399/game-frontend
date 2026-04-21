import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
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
  const textRef = useRef(text);
  const valueRef = useRef(value);
  const onCommitRef = useRef(onCommit);
  const committedRef = useRef(false);

  useLayoutEffect(() => {
    textRef.current = text;
    valueRef.current = value;
    onCommitRef.current = onCommit;
  }, [text, value, onCommit]);

  useEffect(() => {
    committedRef.current = false;
  }, [value]);

  const commitText = (nextText: string) => {
    if (committedRef.current) {
      return;
    }
    const next = parseCommittedTotalRounds(nextText);
    setText(String(next));
    if (next === valueRef.current) {
      return;
    }
    committedRef.current = true;
    onCommitRef.current(next);
  };

  const handleEnterCommit = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") {
      return;
    }
    event.preventDefault();
    commitText(event.currentTarget.value);
    event.currentTarget.blur();
  };

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
        setText(takeDigits(e.target.value));
      }}
      onBlur={(e) => {
        commitText(e.currentTarget.value);
      }}
      onKeyDown={handleEnterCommit}
      className={className}
    />
  );
}
