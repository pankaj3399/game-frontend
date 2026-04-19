import { Calendar, Clock3, IconTimerPause, Tag, Timer } from "@/icons/figma-icons";
import type { TournamentDetail } from "@/models/tournament/types";
import type { TFunction } from "i18next";
import GameModeIcon from "@/assets/icons/figma/misc/frame.svg?react";
import { InfoItem } from "./InfoItem";

interface TournamentMetaProps {
  tournament: TournamentDetail;
  formattedDate: string;
  formattedTime: string;
  feeText: string;
  t: TFunction;
}

export function TournamentMeta({ tournament, formattedDate, formattedTime, feeText, t }: TournamentMetaProps) {
  return (
    <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-4 sm:mt-[25px] sm:gap-x-8 sm:gap-y-5">
      <InfoItem icon={Calendar} value={formattedDate} label={t("tournaments.date")} />

      <InfoItem icon={Clock3} value={formattedTime} label={t("tournaments.time")} />

      <div className="flex items-start gap-3 sm:gap-6">
        <GameModeIcon aria-hidden className="mt-[1px] h-5 w-5 shrink-0 text-[#010a04] sm:h-6 sm:w-6" />
        <div className="min-w-0">
          <p className="text-[14px] font-medium leading-snug text-[#010a04] sm:text-[16px] sm:leading-5">
            {tournament.playMode || t("tournaments.notSpecified")}
          </p>
          <p className="text-[12px] leading-snug text-[#010a04]/60 sm:text-[14px] sm:leading-5">
            {t("tournaments.gameMode")}
          </p>
        </div>
      </div>

      <InfoItem
        icon={Timer}
        value={
          tournament.duration == null
            ? t("tournaments.notSpecified")
            : t("tournaments.durationMinutes", { minutes: tournament.duration })
        }
        valueClassName="capitalize"
        label={t("tournaments.matchDuration")}
      />

      <InfoItem
        icon={IconTimerPause}
        value={
          tournament.breakDuration == null
            ? t("tournaments.notSpecified")
            : t("tournaments.durationMinutes", { minutes: tournament.breakDuration })
        }
        valueClassName="capitalize"
        label={t("tournaments.breakTime")}
      />

      <InfoItem icon={Tag} value={feeText} label={t("tournaments.feeSidebarCaption")} />
    </div>
  );
}
