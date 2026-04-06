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
    <div className="mt-[25px] grid grid-cols-2 gap-x-4 gap-y-5 sm:gap-x-8">
      <InfoItem icon={Calendar} value={formattedDate} label={t("tournaments.date")} />

      <InfoItem icon={Clock3} value={formattedTime} label={t("tournaments.time")} />

      <div className="flex items-start gap-4 sm:gap-6">
        <GameModeIcon width={24} height={24} aria-hidden className="mt-[1px] text-[#010a04]" />
        <div>
          <p className="text-[16px] font-medium leading-5 text-[#010a04]">
            {tournament.playMode || t("tournaments.notSpecified")}
          </p>
          <p className="text-[14px] leading-5 text-[#010a04]/60">{t("tournaments.gameMode")}</p>
        </div>
      </div>

      <InfoItem
        icon={Timer}
        value={tournament.duration || t("tournaments.notSpecified")}
        valueClassName="capitalize"
        label={t("tournaments.matchDuration")}
      />

      <InfoItem
        icon={IconTimerPause}
        value={tournament.breakDuration || t("tournaments.notSpecified")}
        valueClassName="capitalize"
        label={t("tournaments.breakTime")}
      />

      <InfoItem icon={Tag} value={feeText} label={t("tournaments.feeSidebarCaption")} />
    </div>
  );
}
