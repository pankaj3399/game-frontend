import { useTranslation } from "react-i18next";
import type {
  GenerateTournamentDoublesPairsResponse,
  TournamentScheduleMode,
} from "@/models/tournament/types";
import { ScheduleParticipantsTable } from "./ScheduleParticipantsTable";
import { SchedulePlayingModeControl } from "./SchedulePlayingModeControl";
import type { ScheduleParticipantRow } from "../helpers/scheduleParticipants";

interface TournamentScheduleParticipantsCardProps {
  mode: TournamentScheduleMode;
  participants: ScheduleParticipantRow[];
  doublesPairs: GenerateTournamentDoublesPairsResponse | null;
  doublesPairsLoading: boolean;
  onPlayingModeChange: (nextMode: TournamentScheduleMode) => Promise<void> | void;
  onEditParticipant: (participantId: string) => void;
  onRemoveParticipant: (participantId: string) => void;
  onReorderParticipant: (activeId: string, overId: string) => void;
}

export function TournamentScheduleParticipantsCard({
  mode,
  participants,
  doublesPairs,
  doublesPairsLoading,
  onPlayingModeChange,
  onEditParticipant,
  onRemoveParticipant,
  onReorderParticipant,
}: TournamentScheduleParticipantsCardProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-[12px] border border-[rgba(1,10,4,0.08)] bg-white px-[15px] py-5 shadow-[0_3px_15px_rgba(0,0,0,0.06)] sm:px-5">
      <div className="mb-4 flex flex-col gap-3 sm:mb-3">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <h3 className="text-[20px] font-medium text-[#010a04]">
            {t("tournaments.scheduleParticipantsTitle")}
          </h3>
          <SchedulePlayingModeControl
            mode={mode}
            doublesLocked={participants.length < 2 && mode !== "doubles"}
            pairingPending={doublesPairsLoading && mode === "doubles"}
            onChange={(next) => {
              void onPlayingModeChange(next);
            }}
            t={t}
            className="shrink-0"
          />
        </div>
        {participants.length < 2 && mode === "singles" ? (
          <p className="text-[12px] leading-relaxed text-[#010a04]/55 sm:text-left">
            {t("tournaments.schedulePlayingModeDoublesHint")}
          </p>
        ) : null}
      </div>

      <ScheduleParticipantsTable
        mode={mode}
        participants={participants}
        doublesPairs={doublesPairs}
        doublesPairsLoading={doublesPairsLoading && mode === "doubles"}
        onEditParticipant={onEditParticipant}
        onRemoveParticipant={onRemoveParticipant}
        onReorderParticipant={onReorderParticipant}
      />
    </div>
  );
}
