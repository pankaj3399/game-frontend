import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import InlineLoader from "@/components/shared/InlineLoader";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TimePicker } from "@/components/ui/time-picker";
import { ChevronLeft } from "@/icons/figma-icons";
import { getErrorMessage } from "@/lib/errors";
import {
  useGenerateTournamentDoublesPairs,
  useGenerateTournamentSchedule,
  useTournamentById,
  useTournamentSchedule,
} from "@/pages/tournaments/hooks";
import { clampTime24ToBounds, resolveTournamentScheduleTimeBounds } from "@/utils/time";
import type {
  GenerateTournamentDoublesPairsResponse,
  TournamentScheduleMode,
} from "@/models/tournament/types";
import { ScheduleParticipantsTable } from "./schedule/ScheduleParticipantsTable";
import {
  canGenerateSchedule,
  moveParticipant,
  normalizeParticipantRows,
  participantOrderIds,
  removeParticipant,
  type ScheduleParticipantRow,
} from "./schedule/helpers";

const MATCH_DURATION_OPTIONS = [30, 45, 60, 75, 90];
const BREAK_DURATION_OPTIONS = [0, 5, 10, 15, 20, 30];
const GAMES_PER_PLAYER_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function TournamentSchedulePage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();

  const scheduleQuery = useTournamentSchedule(id ?? null, Boolean(id));
  const tournamentDetailQuery = useTournamentById(id ?? null, Boolean(id));
  const generateScheduleMutation = useGenerateTournamentSchedule();
  const generateDoublesPairsMutation = useGenerateTournamentDoublesPairs();

  const scheduleTimeBounds = useMemo(
    () =>
      resolveTournamentScheduleTimeBounds(
        tournamentDetailQuery.data?.tournament.startTime,
        tournamentDetailQuery.data?.tournament.endTime
      ),
    [tournamentDetailQuery.data?.tournament.startTime, tournamentDetailQuery.data?.tournament.endTime]
  );

  const [matchDurationMinutes, setMatchDurationMinutes] = useState(60);
  const [breakTimeMinutes, setBreakTimeMinutes] = useState(5);
  const [gamesPerPlayer, setGamesPerPlayer] = useState(5);
  const [startTime, setStartTime] = useState("09:00");
  const [mode, setMode] = useState<TournamentScheduleMode>("singles");
  const [participants, setParticipants] = useState<ScheduleParticipantRow[]>([]);
  const [selectedCourtIds, setSelectedCourtIds] = useState<string[]>([]);
  const [doublesPairs, setDoublesPairs] = useState<GenerateTournamentDoublesPairsResponse | null>(null);

  useEffect(() => {
    if (!scheduleQuery.data) {
      return;
    }

    const defaults = scheduleQuery.data.scheduleInput;
    setMatchDurationMinutes(defaults.matchDurationMinutes);
    setBreakTimeMinutes(defaults.breakTimeMinutes);
    setGamesPerPlayer(defaults.gamesPerPlayer);
    setStartTime(defaults.startTime);
    setMode(defaults.mode);
    setParticipants(normalizeParticipantRows(scheduleQuery.data.participants));
    setSelectedCourtIds(
      defaults.availableCourts.filter((court) => court.selected).map((court) => court.id)
    );
    setDoublesPairs(null);
  }, [scheduleQuery.data]);

  useEffect(() => {
    setStartTime((prev) => clampTime24ToBounds(prev, scheduleTimeBounds));
  }, [scheduleTimeBounds]);

  if (!id) {
    return <Navigate to="/tournaments" replace />;
  }

  const roundFromQuery = Number.parseInt(searchParams.get("round") ?? "", 10);
  const defaultRound = scheduleQuery.data?.scheduleSummary.currentRound || 1;
  const round = Number.isFinite(roundFromQuery) && roundFromQuery >= 1 ? roundFromQuery : Math.max(1, defaultRound);

  const availableCourts = scheduleQuery.data?.scheduleInput.availableCourts ?? [];

  const canSubmit = useMemo(
    () =>
      selectedCourtIds.length > 0 &&
      canGenerateSchedule(mode, participants.length) &&
      !generateScheduleMutation.isPending,
    [selectedCourtIds.length, mode, participants.length, generateScheduleMutation.isPending]
  );

  const toggleCourt = (courtId: string) => {
    setSelectedCourtIds((prev) =>
      prev.includes(courtId)
        ? prev.filter((idValue) => idValue !== courtId)
        : [...prev, courtId]
    );
  };

  const onSelectSingles = () => {
    setMode("singles");
  };

  const onSelectDoubles = async () => {
    if (participants.length < 2 || generateDoublesPairsMutation.isPending) {
      return;
    }

    if (doublesPairs) {
      setMode("doubles");
      return;
    }

    setMode("doubles");
    try {
      const response = await generateDoublesPairsMutation.mutateAsync({
        id,
        payload: {
          participantOrder: participantOrderIds(participants),
        },
      });
      setDoublesPairs(response);
    } catch (err) {
      setMode("singles");
      toast.error(getErrorMessage(err) ?? t("tournaments.schedulePairsError"));
    }
  };

  const onGenerateSchedule = async () => {
    try {
      await generateScheduleMutation.mutateAsync({
        id,
        payload: {
          round,
          mode,
          matchDurationMinutes,
          breakTimeMinutes,
          gamesPerPlayer,
          startTime,
          courtIds: selectedCourtIds,
          participantOrder: participantOrderIds(participants),
        },
      });

      toast.success(t("tournaments.scheduleGenerated", { round }));
    } catch (err) {
      toast.error(getErrorMessage(err) ?? t("tournaments.scheduleGenerateError"));
    }
  };

  if (scheduleQuery.isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8">
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 text-sm text-[#6b7280]">
          {t("common.loading")}
        </div>
      </div>
    );
  }

  if (scheduleQuery.isError || !scheduleQuery.data) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8">
        <div className="rounded-xl border border-[#f1b3b3] bg-[#fff7f7] p-6 text-sm text-[#a02626]">
          {getErrorMessage(scheduleQuery.error) ?? t("tournaments.scheduleLoadError")}
        </div>
        <div>
          <Button asChild variant="outline">
            <Link to={`/tournaments/${id}`}>{t("tournaments.goBack")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 pb-10 pt-8 sm:px-6">
      <div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="group h-auto w-fit gap-1.5 px-1 text-[14px] font-medium text-[#010a04]/70 hover:bg-transparent hover:text-[#010a04]"
        >
          <Link to={`/tournaments/${id}`}>
            <ChevronLeft size={16} className="text-[#010a04]/70 group-hover:text-[#010a04]" />
            {t("tournaments.goBack")}
          </Link>
        </Button>
      </div>

      <div className="rounded-[12px] border border-[rgba(1,10,4,0.08)] bg-white px-5 py-5 shadow-[0_3px_15px_rgba(0,0,0,0.06)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e7eb] pb-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 overflow-hidden rounded-[10px] bg-[#e4dbcc]">
              <img src="/tennis-ball.png" alt="" className="h-full w-full object-cover" />
            </div>
            <h1 className="truncate text-[24px] font-semibold text-[#010a04]">
              {scheduleQuery.data.tournament.name}
            </h1>
          </div>
        </div>

        <h2 className="mb-4 text-[22px] font-medium text-[#010a04]">{t("tournaments.scheduleInputTitle")}</h2>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <p className="text-[12px] font-medium uppercase text-[#010a04]/70">{t("tournaments.matchDuration")}</p>
            <Select
              value={String(matchDurationMinutes)}
              onValueChange={(value) => setMatchDurationMinutes(Number.parseInt(value, 10))}
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

          <div className="space-y-2">
            <p className="text-[12px] font-medium uppercase text-[#010a04]/70">{t("tournaments.breakTime")}</p>
            <Select
              value={String(breakTimeMinutes)}
              onValueChange={(value) => setBreakTimeMinutes(Number.parseInt(value, 10))}
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

          <div className="space-y-2">
            <p className="text-[12px] font-medium uppercase text-[#010a04]/70">{t("tournaments.scheduleGamesPerPlayer")}</p>
            <Select
              value={String(gamesPerPlayer)}
              onValueChange={(value) => setGamesPerPlayer(Number.parseInt(value, 10))}
            >
              <SelectTrigger className="h-[38px] w-full rounded-[8px] border-[#e1e3e8] bg-[#f9fafc] text-[14px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GAMES_PER_PLAYER_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p
              id="tournament-schedule-start-time-label"
              className="text-[12px] font-medium uppercase text-[#010a04]/70"
            >
              {t("tournaments.time")}
            </p>
            <TimePicker
              id="tournament-schedule-start-time"
              aria-labelledby="tournament-schedule-start-time-label"
              value={startTime}
              onChange={(next) => {
                if (next) setStartTime(next);
              }}
              minTime={scheduleTimeBounds.minTime}
              maxTime={scheduleTimeBounds.maxTime}
              stepMinutes={1}
              allowClear={false}
              popoverAlign="end"
            />
          </div>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-[12px] font-medium uppercase text-[#010a04]/70">
            {t("tournaments.scheduleAvailableCourts")}
          </p>
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {availableCourts.map((court) => {
              const selected = selectedCourtIds.includes(court.id);
              return (
                <button
                  key={court.id}
                  type="button"
                  onClick={() => toggleCourt(court.id)}
                  className={`h-[38px] rounded-[8px] border px-3 text-[14px] font-normal transition-colors ${
                    selected
                      ? "border-[#1b8135] bg-[#e8f5ec] text-[#1b8135]"
                      : "border-[#e1e3e8] bg-[#f9fafc] text-[#010a04] hover:border-[#010a04]/20 hover:bg-[#f3f4f6]"
                  }`}
                >
                  {court.name}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[12px] font-medium uppercase text-[#010a04]/60">
            {t("tournaments.scheduleSelectedCourts", { count: selectedCourtIds.length })}
          </p>
        </div>

        <div className="mt-4">
          <Button
            type="button"
            onClick={onGenerateSchedule}
            disabled={!canSubmit}
            className="h-[38px] w-full rounded-[8px] bg-[#1b8135] text-[16px] font-medium text-white hover:bg-[#166b2d]"
          >
            {generateScheduleMutation.isPending
              ? t("tournaments.scheduleGenerating")
              : t("tournaments.scheduleGenerateButton")}
          </Button>
        </div>
      </div>

      <div className="rounded-[12px] border border-[rgba(1,10,4,0.08)] bg-white px-5 py-5 shadow-[0_3px_15px_rgba(0,0,0,0.06)]">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[20px] font-medium text-[#010a04]">{t("tournaments.scheduleParticipantsTitle")}</h3>

          <div className="rounded-[10px] bg-[#010a04]/[0.05] p-1">
            <button
              type="button"
              onClick={onSelectSingles}
              className={`h-[30px] rounded-[8px] px-4 text-[14px] font-medium transition-colors ${
                mode === "singles"
                  ? "bg-white text-[#010a04] shadow-[0_0_4px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.06)]"
                  : "text-[#010a04]/70 hover:text-[#010a04]"
              }`}
            >
              {t("tournaments.scheduleSingles")}
            </button>
            <button
              type="button"
              onClick={onSelectDoubles}
              disabled={participants.length < 2 || generateDoublesPairsMutation.isPending}
              className={`inline-flex h-[30px] items-center justify-center gap-2 rounded-[8px] px-4 text-[14px] font-medium transition-colors ${
                mode === "doubles"
                  ? "bg-white text-[#010a04] shadow-[0_0_4px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.06)]"
                  : "text-[#010a04]/70 hover:text-[#010a04]"
              } disabled:opacity-60`}
            >
              {generateDoublesPairsMutation.isPending && mode === "doubles" ? (
                <InlineLoader size="sm" className="border-t-[#1b8135] border-muted-foreground/20" />
              ) : null}
              {t("tournaments.scheduleDoubles")}
            </button>
          </div>
        </div>

        <ScheduleParticipantsTable
          mode={mode}
          participants={participants}
          doublesPairs={doublesPairs}
          doublesPairsLoading={generateDoublesPairsMutation.isPending && mode === "doubles"}
          onEditParticipant={() => toast.info(t("common.comingSoon"))}
          onRemoveParticipant={(participantId) => setParticipants((prev) => removeParticipant(prev, participantId))}
          onMoveParticipant={(index, direction) =>
            setParticipants((prev) => moveParticipant(prev, index, direction))
          }
        />
      </div>
    </div>
  );
}
