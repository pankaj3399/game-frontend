import { useMemo } from "react";
import type { TFunction } from "i18next";
import { getDateFnsLocale } from "@/lib/dateFnsLocale";
import type { TournamentDetail } from "@/models/tournament/types";
import { formatDateDisplay, formatTimeRangeDisplay, formatTimeZoneAbbreviation } from "@/utils/display";
import { formatTimeTo24Hour } from "@/utils/time";
import { UI_LIMITS } from "./constants";

interface UseTournamentInfoArgs {
  tournament: TournamentDetail;
  t: TFunction;
  language: string;
  isDescriptionExpanded: boolean;
}

export function useTournamentInfo({ tournament, t, language, isDescriptionExpanded }: UseTournamentInfoArgs) {
  return useMemo(() => {
    const entryFee = Number.isFinite(tournament.entryFee) ? tournament.entryFee : 0;
    const feeText =
      entryFee > 0 ? t("tournaments.entryFeeFormat", { amount: entryFee }) : t("tournaments.entryFeeFree");

    const foodInfoTrimmed = tournament.foodInfo?.trim() ?? "";
    const hasFoodInfo = foodInfoTrimmed.length > 0;

    const normalizedDescription = tournament.descriptionInfo?.trim() ?? "";
    const hasDescription = normalizedDescription.length > 0;
    const descriptionText = hasDescription ? normalizedDescription : t("tournaments.noDescription");
    const isDescriptionCollapsible = hasDescription && descriptionText.length > UI_LIMITS.DESCRIPTION_PREVIEW;
    const descriptionDisplay =
      isDescriptionExpanded || !isDescriptionCollapsible
        ? descriptionText
        : `${descriptionText.slice(0, UI_LIMITS.DESCRIPTION_PREVIEW)}…`;

    const hasParticipants = tournament.participants.length > 0;
    const participantSummary = hasParticipants
      ? tournament.participants
          .map((participant) => participant.name ?? participant.alias ?? t("tournaments.unknownPlayer"))
          .join(", ")
      : "";
    const isPlayersCollapsible = participantSummary.length > UI_LIMITS.DESCRIPTION_PREVIEW;

    const spotPercentage = Math.max(0, Math.min(100, tournament.progress.percentage));

    const formattedDate = formatDateDisplay(
      tournament.date,
      t("tournaments.unscheduled"),
      getDateFnsLocale(language)
    );

    const formattedTime = formatTimeRangeDisplay(
      tournament.startTime,
      tournament.endTime,
      t("tournaments.unscheduled"),
      (start, end) => t("tournaments.timeRange", { start, end })
    );
    const hasScheduledTime = Boolean(
      formatTimeTo24Hour(tournament.startTime) || formatTimeTo24Hour(tournament.endTime)
    );
    const formattedTimeZone = hasScheduledTime
      ? formatTimeZoneAbbreviation(tournament.timezone, tournament.date)
      : null;

    return {
      feeText,
      foodInfoTrimmed,
      hasFoodInfo,
      hasDescription,
      descriptionDisplay,
      isDescriptionCollapsible,
      hasParticipants,
      participantSummary,
      isPlayersCollapsible,
      spotPercentage,
      formattedDate,
      formattedTime,
      formattedTimeZone,
    };
  }, [isDescriptionExpanded, language, t, tournament]);
}
