import type { TFunction } from "i18next";
import { MATCH_STATUS_KEYS, statusClassName } from "./deriveMatches";
import type { DerivedMatch } from "./types";

interface MatchCardProps {
  match: DerivedMatch;
  t: TFunction;
}

export function MatchCard({ match, t }: MatchCardProps) {
  return (
    <div className="rounded-xl bg-card-surface p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex gap-1.5">
          <span className="size-5 rounded-full bg-[#e5e7eb]" />
          <span className="size-5 rounded-full bg-[#e5e7eb]" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight text-[#111827]">
            {match.playerA} / {match.playerB}
          </p>
          <p className="mt-1 text-xs text-[#6b7280]">{match.scheduledText}</p>
        </div>
      </div>

      <p className="mt-3 text-xs text-[#9ca3af]">
        <span className="font-medium text-[#6b7280]">{t("tournaments.court")}:</span> {match.courtName}
      </p>

      <div className="mt-3 flex items-center gap-2">
        <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${statusClassName(match.status)}`}>
          {t(MATCH_STATUS_KEYS[match.status])}
        </span>
        <span className="rounded bg-[#111827] px-2 py-0.5 text-[11px] font-semibold text-white">
          {t("tournaments.roundNumber", { round: match.round })}
        </span>
      </div>
    </div>
  );
}
