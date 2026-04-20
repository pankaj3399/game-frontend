import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TimePicker } from "@/components/ui/time-picker";
import type { TournamentScheduleInput } from "@/models/tournament/types";
import { resolveTournamentScheduleTimeBounds } from "@/utils/time";
import { getPreviousRoundGate } from "../helpers/tournamentRoundWorkflow";

const MATCH_DURATION_OPTIONS = [30, 45, 60, 75, 90];
const BREAK_DURATION_OPTIONS = [0, 5, 10, 15, 20, 30];
const MATCHES_PER_PLAYER_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

interface TournamentScheduleConfigCardProps {
  tournamentName: string;
  isScheduledTournament: boolean;
  matchDurationMinutes: number;
  breakTimeMinutes: number;
  matchesPerPlayer: number;
  startTime: string;
  scheduleTimeBounds: ReturnType<typeof resolveTournamentScheduleTimeBounds>;
  availableCourts: TournamentScheduleInput["availableCourts"];
  selectedCourtIds: string[];
  canSubmit: boolean;
  scheduleRoundGate: ReturnType<typeof getPreviousRoundGate>;
  isGenerating: boolean;
  onMatchDurationChange: (value: number) => void;
  onBreakTimeChange: (value: number) => void;
  onMatchesPerPlayerChange: (value: number) => void;
  onStartTimeChange: (next: string | null) => void;
  onToggleCourt: (courtId: string) => void;
  onGenerateSchedule: () => void;
}

export function TournamentScheduleConfigCard({
  tournamentName,
  isScheduledTournament,
  matchDurationMinutes,
  breakTimeMinutes,
  matchesPerPlayer,
  startTime,
  scheduleTimeBounds,
  availableCourts,
  selectedCourtIds,
  canSubmit,
  scheduleRoundGate,
  isGenerating,
  onMatchDurationChange,
  onBreakTimeChange,
  onMatchesPerPlayerChange,
  onStartTimeChange,
  onToggleCourt,
  onGenerateSchedule,
}: TournamentScheduleConfigCardProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-[12px] border border-[rgba(1,10,4,0.08)] bg-white px-[15px] py-5 shadow-[0_3px_15px_rgba(0,0,0,0.06)] sm:px-5">
      <div className="mb-5 border-b border-[#e5e7eb] pb-5">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#e4dbcc] ring-1 ring-[#010a04]/[0.06] sm:h-12 sm:w-12">
            <img src="/tennis-ball.png" alt="" className="h-full w-full object-cover" />
          </div>
          <h1 className="min-w-0 flex-1 break-words text-balance text-[22px] font-bold leading-[1.15] tracking-tight text-[#010a04] sm:text-[26px] lg:text-[28px]">
            {tournamentName}
          </h1>
        </div>
      </div>

      <h2 className="mb-[18px] text-[18px] font-medium text-[#010a04] sm:text-[22px]">
        {t("tournaments.scheduleInputTitle")}
      </h2>

      <div className="grid grid-cols-2 gap-[10px] md:grid-cols-2 lg:grid-cols-4">
        {isScheduledTournament ? (
          <div className="space-y-2">
            <p className="text-[12px] font-medium uppercase text-[#010a04]/70">
              {t("tournaments.matchDuration")}
            </p>
            <Select
              value={String(matchDurationMinutes)}
              onValueChange={(value) => {
                onMatchDurationChange(Number.parseInt(value, 10));
              }}
            >
              <SelectTrigger className="h-[38px] w-full rounded-[8px] border-[#e1e3e8] bg-[#f9fafc] text-[14px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MATCH_DURATION_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option} min
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        {isScheduledTournament ? (
          <div className="space-y-2">
            <p className="text-[12px] font-medium uppercase text-[#010a04]/70">
              {t("tournaments.breakTime")}
            </p>
            <Select
              value={String(breakTimeMinutes)}
              onValueChange={(value) => {
                onBreakTimeChange(Number.parseInt(value, 10));
              }}
            >
              <SelectTrigger className="h-[38px] w-full rounded-[8px] border-[#e1e3e8] bg-[#f9fafc] text-[14px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BREAK_DURATION_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option} min
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <div className="space-y-2">
          <p className="text-[12px] font-medium uppercase text-[#010a04]/70">
            {t("tournaments.scheduleMatchesPerPlayer")}
          </p>
          <Select
            value={String(matchesPerPlayer)}
            onValueChange={(value) => {
              onMatchesPerPlayerChange(Number.parseInt(value, 10));
            }}
          >
            <SelectTrigger className="h-[38px] w-full rounded-[8px] border-[#e1e3e8] bg-[#f9fafc] text-[14px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MATCHES_PER_PLAYER_OPTIONS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <p id="tournament-schedule-start-time-label" className="text-[12px] font-medium uppercase text-[#010a04]/70">
            {t("tournaments.time")}
          </p>
          <TimePicker
            id="tournament-schedule-start-time"
            aria-labelledby="tournament-schedule-start-time-label"
            value={startTime}
            onChange={onStartTimeChange}
            minTime={scheduleTimeBounds.minTime}
            maxTime={scheduleTimeBounds.maxTime}
            stepMinutes={1}
            allowClear={false}
            popoverAlign="end"
            triggerClassName="h-[38px] rounded-[8px] border-[#e1e3e8] bg-[#f9fafc] text-[14px] shadow-none hover:bg-[#f9fafc] hover:text-[#010a04] sm:h-[38px] sm:rounded-[8px] sm:px-3 sm:text-[14px] [&_svg]:opacity-50"
          />
        </div>
      </div>

      <div className="mt-[15px]">
        <div className="mb-[10px] flex items-center justify-between gap-3">
          <p className="text-[12px] font-medium uppercase text-[#010a04]/70">
            {t("tournaments.scheduleAvailableCourts")}
          </p>
          <p className="text-[12px] uppercase text-[#010a04]/55">
            {t("tournaments.scheduleSelectedCourts", { count: selectedCourtIds.length })}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-[10px] sm:grid-cols-3 lg:grid-cols-6">
          {availableCourts.map((court) => {
            const selected = selectedCourtIds.includes(court.id);
            return (
              <button
                key={court.id}
                type="button"
                aria-pressed={selected}
                onClick={() => onToggleCourt(court.id)}
                className={`h-[38px] rounded-[8px] border px-3 text-[14px] font-medium transition-colors ${
                  selected
                    ? "border-[1.5px] border-[#067429] bg-[#0a6925]/10 text-[#067429]"
                    : "border border-[#010a04]/[0.12] bg-transparent text-[#010a04]/70 hover:border-[#010a04]/20 hover:bg-[#f3f4f6]"
                }`}
              >
                {court.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-[25px]">
        <Button
          type="button"
          onClick={onGenerateSchedule}
          disabled={!canSubmit}
          className="h-[38px] w-full rounded-[8px] bg-gradient-to-r from-[#0a6925] via-[#0c7b2c] to-[#0f8d33] text-[16px] font-medium text-white hover:from-[#0a5f22] hover:via-[#0b7028] hover:to-[#0e812f]"
        >
          {isGenerating
            ? t("tournaments.scheduleGenerating")
            : t("tournaments.scheduleGenerateButton")}
        </Button>
        {scheduleRoundGate.blocked ? (
          <p className="mt-2 text-[12px] text-[#a02626]">
            {scheduleRoundGate.reason === "missing"
              ? t("tournaments.schedulePreviousRoundMissing", {
                  round: scheduleRoundGate.previousRound,
                })
              : t("tournaments.schedulePreviousRoundIncomplete", {
                  round: scheduleRoundGate.previousRound,
                })}
          </p>
        ) : null}
      </div>
    </div>
  );
}
