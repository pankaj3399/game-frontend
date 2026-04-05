import type { ReactNode } from "react";
import type { TFunction } from "i18next";
import { ChevronDown, ChevronUp, UserCircle2 } from "@/icons/figma-icons";
import type { TournamentParticipant } from "@/models/tournament/types";
import { UI_LIMITS } from "./constants";

interface PlayersListProps {
  participants: TournamentParticipant[];
  participantSummary: string;
  hasParticipants: boolean;
  isPlayersCollapsible: boolean;
  isPlayersListExpanded: boolean;
  onToggle: () => void;
  t: TFunction;
}

function getPlayersContent({
  participants,
  participantSummary,
  hasParticipants,
  isPlayersCollapsible,
  isPlayersListExpanded,
  t,
}: Omit<PlayersListProps, "onToggle">): ReactNode {
  if (!hasParticipants) {
    return <p className="text-[14px] text-[#010a04]/60">{t("tournaments.noPlayersYet")}</p>;
  }

  if (isPlayersListExpanded || !isPlayersCollapsible) {
    return (
      <div className="grid grid-cols-2 gap-[10px] sm:gap-[14px]">
        {participants.map((participant) => (
          <div
            key={participant.id}
            className="flex items-center gap-3 rounded-[12px] border border-[#010a04]/[0.08] bg-white px-3 py-2.5 sm:gap-5 sm:px-[15px] sm:py-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[20px] border-[1.5px] border-[#010a04] bg-[#dddddd]/60 sm:h-10 sm:w-10">
              <UserCircle2 size={30} className="text-[#010a04]" />
            </div>
            <div className="flex min-w-0 flex-col gap-1.5">
              <p className="truncate text-[14px] leading-5 text-[#010a04] sm:text-[16px]">
                {participant.name ?? participant.alias ?? t("tournaments.unknownPlayer")}
              </p>
              <p className="truncate text-[14px] leading-[18px] text-[#6a6a6a]">
                {participant.alias?.trim() ? participant.alias : t("tournaments.participantNoAlias")}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <p className="text-[14px] leading-5 text-[#010a04]">{`${participantSummary.slice(0, UI_LIMITS.DESCRIPTION_PREVIEW)}…`}</p>;
}

export function PlayersList({
  participants,
  participantSummary,
  hasParticipants,
  isPlayersCollapsible,
  isPlayersListExpanded,
  onToggle,
  t,
}: PlayersListProps) {
  const playersContent = getPlayersContent({
    participants,
    participantSummary,
    hasParticipants,
    isPlayersCollapsible,
    isPlayersListExpanded,
    t,
  });

  return (
    <section className="py-4 sm:py-5">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-[20px] font-semibold text-[#010a04]" id="tournament-current-players-heading">
          {t("tournaments.currentPlayers")}
        </h3>
        {isPlayersCollapsible ? (
          <button
            type="button"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] border border-[#010a04]/25 text-[#010a04] transition-colors hover:bg-[#010a04]/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#010a04]/25"
            aria-expanded={isPlayersListExpanded}
            aria-controls="tournament-current-players-content"
            aria-label={
              isPlayersListExpanded ? t("tournaments.collapsePlayerList") : t("tournaments.expandPlayerList")
            }
            onClick={onToggle}
          >
            {isPlayersListExpanded ? (
              <ChevronUp size={16} className="text-[#010a04]" aria-hidden />
            ) : (
              <ChevronDown size={16} className="text-[#010a04]" aria-hidden />
            )}
          </button>
        ) : null}
      </div>

      <div id="tournament-current-players-content" aria-labelledby="tournament-current-players-heading">
        {playersContent}
      </div>
    </section>
  );
}
