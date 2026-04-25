import { useRef, useState } from "react";
import type { TFunction } from "i18next";
import { cn } from "@/lib/utils";
import { MATCH_STATUS_KEYS, statusClassName } from "./deriveMatches";
import type { DerivedMatch } from "./types";

function matchListHeadline(match: DerivedMatch, t: (key: string) => string): string {
  const versus = t("tournaments.matchPlayersVersus");
  const a = match.playerA.trim();
  const b = match.playerB.trim();
  const parts = [a, b].filter(Boolean);
  if (parts.length === 0) {
    return t("tournaments.unknownPlayer");
  }
  if (parts.length === 1) {
    return parts[0];
  }
  return `${a} ${versus} ${b}`;
}

function firstLetterFromDisplayName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    return "?";
  }
  return trimmed[0]!.toLocaleUpperCase();
}

interface MatchCardProps {
  match: DerivedMatch;
  t: TFunction;
}

export function MatchCard({ match, t }: MatchCardProps) {
  const headlineRef = useRef<HTMLParagraphElement | null>(null);
  const [showHeadlineTooltip, setShowHeadlineTooltip] = useState(false);

  const headline = matchListHeadline(match, t);
  const trimmedA = match.playerA.trim();
  const trimmedB = match.playerB.trim();
  const normalizedDisplayA = trimmedA || trimmedB || "";
  const normalizedDisplayB =
    trimmedA && trimmedB
      ? trimmedB
      : "";
  const letterA = firstLetterFromDisplayName(normalizedDisplayA);
  const letterB = firstLetterFromDisplayName(normalizedDisplayB);
  const hasSecondSide = normalizedDisplayB.trim().length > 0;

  const avatarClass =
    "relative flex size-5 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-[10px] font-semibold leading-none text-foreground ring-2 ring-background";
  const maybeShowHeadlineTooltip = () => {
    const element = headlineRef.current;
    if (!element) {
      setShowHeadlineTooltip(false);
      return;
    }
    setShowHeadlineTooltip(element.scrollWidth > element.clientWidth);
  };

  return (
    <div className="rounded-[12px] border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 flex shrink-0"
          aria-hidden
          title={headline}
        >
          <span className={cn(avatarClass, "z-0")}>{letterA}</span>
          {hasSecondSide ? (
            <span className={cn(avatarClass, "z-10 -ml-1")}>{letterB}</span>
          ) : null}
        </div>
        <div className="relative min-w-0">
          <p
            ref={headlineRef}
            className="truncate text-sm font-semibold leading-tight text-foreground"
            onMouseEnter={maybeShowHeadlineTooltip}
            onMouseLeave={() => setShowHeadlineTooltip(false)}
            onFocus={maybeShowHeadlineTooltip}
            onBlur={() => setShowHeadlineTooltip(false)}
            title={showHeadlineTooltip ? undefined : headline}
            tabIndex={0}
          >
            {headline}
          </p>
          {showHeadlineTooltip ? (
            <div
              className="pointer-events-none absolute left-0 top-full z-20 mt-1 max-w-[min(30rem,calc(100vw-3rem))] rounded-md border border-border bg-popover px-3 py-2 text-xs font-medium leading-snug text-popover-foreground shadow-md"
            >
              {headline}
            </div>
          ) : null}
          <p className="mt-1 text-xs text-muted-foreground">{match.scheduledText}</p>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        <span className="font-medium text-foreground/80">{t("tournaments.court")}:</span> {match.courtName}
      </p>

      <div className="mt-3 flex items-center gap-2">
        <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${statusClassName(match.status)}`}>
          {t(MATCH_STATUS_KEYS[match.status])}
        </span>
        <span className="rounded bg-foreground px-2 py-0.5 text-[11px] font-semibold text-background">
          {t("tournaments.roundNumber", { round: match.round })}
        </span>
      </div>
    </div>
  );
}
