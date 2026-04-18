import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
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
  useTournamentMatches,
  useTournamentSchedule,
} from "@/pages/tournaments/hooks";
import { clampTime24ToBounds, resolveTournamentScheduleTimeBounds } from "@/utils/time";
import type {
  GenerateTournamentDoublesPairsResponse,
  TournamentScheduleMode,
} from "@/models/tournament/types";
import { SchedulePlayingModeControl } from "./schedule/SchedulePlayingModeControl";
import { ScheduleParticipantsTable } from "./schedule/ScheduleParticipantsTable";
import {
  canGenerateSchedule,
  moveParticipant,
  normalizeParticipantRows,
  participantOrderIds,
  removeParticipant,
  type ScheduleParticipantRow,
} from "./schedule/helpers";
import {
  getPreviousRoundGate,
  parseRoundQueryParam,
  resolveScheduleInputRound,
} from "./schedule/tournamentRoundWorkflow";

const MATCH_DURATION_OPTIONS = [30, 45, 60, 75, 90];
const BREAK_DURATION_OPTIONS = [0, 5, 10, 15, 20, 30];
const MATCHES_PER_PLAYER_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function TournamentSchedulePage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const scheduleQuery = useTournamentSchedule(id ?? null, Boolean(id));
  const tournamentDetailQuery = useTournamentById(id ?? null, Boolean(id));
  const matchesQuery = useTournamentMatches(id ?? null, Boolean(id));
  const generateScheduleMutation = useGenerateTournamentSchedule();
  const generateDoublesPairsMutation = useGenerateTournamentDoublesPairs();

  const scheduleTimeBounds = resolveTournamentScheduleTimeBounds(
    tournamentDetailQuery.data?.tournament.startTime,
    tournamentDetailQuery.data?.tournament.endTime
  );
  const isScheduledTournament =
    tournamentDetailQuery.data?.tournament.tournamentMode === "singleDay";
  const defaultsLoadedForIdRef = useRef<string | null>(null);
  const loadedDefaultsRef = useRef(false);
  const isDirtyRef = useRef(false);

  const [matchDurationMinutes, setMatchDurationMinutes] = useState(60);
  const [breakTimeMinutes, setBreakTimeMinutes] = useState(5);
  const [matchesPerPlayer, setMatchesPerPlayer] = useState(5);
  const [startTime, setStartTime] = useState("09:00");
  const [mode, setMode] = useState<TournamentScheduleMode>("singles");
  const [participants, setParticipants] = useState<ScheduleParticipantRow[]>([]);
  const [selectedCourtIds, setSelectedCourtIds] = useState<string[]>([]);
  const [doublesPairs, setDoublesPairs] = useState<GenerateTournamentDoublesPairsResponse | null>(null);

  useEffect(() => {
    if (!id || !scheduleQuery.data) {
      return;
    }

    if (defaultsLoadedForIdRef.current !== id) {
      defaultsLoadedForIdRef.current = id;
      loadedDefaultsRef.current = false;
      isDirtyRef.current = false;
    }

    if (loadedDefaultsRef.current && isDirtyRef.current) {
      return;
    }

    const defaults = scheduleQuery.data.scheduleInput;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMatchDurationMinutes(defaults.matchDurationMinutes ?? 60);
    setBreakTimeMinutes(defaults.breakTimeMinutes ?? 5);
    setMatchesPerPlayer(defaults.matchesPerPlayer);
    setStartTime(defaults.startTime);
    setMode(defaults.mode);
    setParticipants(normalizeParticipantRows(scheduleQuery.data.participants));
    setSelectedCourtIds(
      defaults.availableCourts.filter((court) => court.selected).map((court) => court.id)
    );
    setDoublesPairs(null);
    loadedDefaultsRef.current = true;
  }, [id, scheduleQuery.data]);

  if (!id) {
    return <Navigate to="/tournaments" replace />;
  }

  const queryRound = parseRoundQueryParam(searchParams);
  const summaryCurrentRound = scheduleQuery.data?.scheduleSummary.currentRound ?? 0;
  const round = resolveScheduleInputRound(queryRound, summaryCurrentRound);
  const clampedStartTime = clampTime24ToBounds(startTime, scheduleTimeBounds);

  const availableCourts = scheduleQuery.data?.scheduleInput.availableCourts ?? [];
  const tournamentMinimumParticipants =
    tournamentDetailQuery.data?.tournament.minMember ?? 1;
  const enrolledParticipants = participants.length;
  const meetsTournamentMinimum =
    enrolledParticipants >= tournamentMinimumParticipants;

  const scheduleRoundGate = getPreviousRoundGate(round, matchesQuery.data?.matches ?? []);
  const blockedByPreviousRound = scheduleRoundGate.blocked;

  const canSubmit =
    selectedCourtIds.length > 0 &&
    meetsTournamentMinimum &&
    canGenerateSchedule(mode, participants.length) &&
    !blockedByPreviousRound &&
    !matchesQuery.isLoading &&
    !generateScheduleMutation.isPending;

  const toggleCourt = (courtId: string) => {
    isDirtyRef.current = true;
    setSelectedCourtIds((prev) =>
      prev.includes(courtId)
        ? prev.filter((idValue) => idValue !== courtId)
        : [...prev, courtId]
    );
  };

  const onPlayingModeChange = async (nextMode: TournamentScheduleMode) => {
    if (nextMode === mode) {
      return;
    }

    isDirtyRef.current = true;

    if (nextMode === "singles") {
      setMode("singles");
      return;
    }

    if (generateDoublesPairsMutation.isPending || participants.length < 2) {
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
    if (scheduleRoundGate.blocked) {
      toast.error(
        scheduleRoundGate.reason === "missing"
          ? t("tournaments.schedulePreviousRoundMissing", { round: scheduleRoundGate.previousRound })
          : t("tournaments.schedulePreviousRoundIncomplete", { round: scheduleRoundGate.previousRound })
      );
      return;
    }

    try {
      const payload = {
        round,
        mode,
        matchesPerPlayer,
        startTime: clampedStartTime,
        courtIds: selectedCourtIds,
        participantOrder: participantOrderIds(participants),
        ...(isScheduledTournament
          ? {
              matchDurationMinutes,
              breakTimeMinutes,
            }
          : {}),
      };

      const response = await generateScheduleMutation.mutateAsync({
        id,
        payload,
      });

      toast.success(t("tournaments.scheduleGenerated", { round }));
      navigate(`/tournaments/${id}/schedule?round=${response.schedule.round}`);
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
    <div className="mx-auto flex w-full max-w-[430px] flex-col gap-4 bg-[#f8fbf8] px-4 pb-10 pt-6 sm:max-w-6xl sm:bg-transparent sm:px-6 sm:pt-8">
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

      <div className="rounded-[12px] border border-[rgba(1,10,4,0.08)] bg-white px-[15px] py-5 shadow-[0_3px_15px_rgba(0,0,0,0.06)] sm:px-5">
        <div className="mb-5 border-b border-[#e5e7eb] pb-5">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#e4dbcc] ring-1 ring-[#010a04]/[0.06] sm:h-12 sm:w-12">
              <img src="/tennis-ball.png" alt="" className="h-full w-full object-cover" />
            </div>
            <h1 className="min-w-0 flex-1 break-words text-balance text-[22px] font-bold leading-[1.15] tracking-tight text-[#010a04] sm:text-[26px] lg:text-[28px]">
              {scheduleQuery.data.tournament.name}
            </h1>
          </div>
        </div>

        <h2 className="mb-[18px] text-[18px] font-medium text-[#010a04] sm:text-[22px]">
          {t("tournaments.scheduleInputTitle")}
        </h2>

        <div className="grid grid-cols-2 gap-[10px] md:grid-cols-2 lg:grid-cols-4">
          {isScheduledTournament ? (
            <div className="space-y-2">
              <p className="text-[12px] font-medium uppercase text-[#010a04]/70">{t("tournaments.matchDuration")}</p>
              <Select
                value={String(matchDurationMinutes)}
                onValueChange={(value) => {
                  isDirtyRef.current = true;
                  setMatchDurationMinutes(Number.parseInt(value, 10));
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
              <p className="text-[12px] font-medium uppercase text-[#010a04]/70">{t("tournaments.breakTime")}</p>
              <Select
                value={String(breakTimeMinutes)}
                onValueChange={(value) => {
                  isDirtyRef.current = true;
                  setBreakTimeMinutes(Number.parseInt(value, 10));
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
            <p className="text-[12px] font-medium uppercase text-[#010a04]/70">{t("tournaments.scheduleMatchesPerPlayer")}</p>
            <Select
              value={String(matchesPerPlayer)}
              onValueChange={(value) => {
                isDirtyRef.current = true;
                setMatchesPerPlayer(Number.parseInt(value, 10));
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
            <p
              id="tournament-schedule-start-time-label"
              className="text-[12px] font-medium uppercase text-[#010a04]/70"
            >
              {t("tournaments.time")}
            </p>
            <TimePicker
              id="tournament-schedule-start-time"
              aria-labelledby="tournament-schedule-start-time-label"
              value={clampedStartTime}
              onChange={(next) => {
                if (next) {
                  isDirtyRef.current = true;
                  setStartTime(next);
                }
              }}
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
                  onClick={() => toggleCourt(court.id)}
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
            {generateScheduleMutation.isPending
              ? t("tournaments.scheduleGenerating")
              : t("tournaments.scheduleGenerateButton")}
          </Button>
          {!meetsTournamentMinimum ? (
            <p className="mt-2 text-[12px] text-[#a02626]">
              {t("tournaments.scheduleMinPlayersNotMet", {
                min: tournamentMinimumParticipants,
                current: enrolledParticipants,
              })}
            </p>
          ) : null}
          {scheduleRoundGate.blocked ? (
            <p className="mt-2 text-[12px] text-[#a02626]">
              {scheduleRoundGate.reason === "missing"
                ? t("tournaments.schedulePreviousRoundMissing", { round: scheduleRoundGate.previousRound })
                : t("tournaments.schedulePreviousRoundIncomplete", { round: scheduleRoundGate.previousRound })}
            </p>
          ) : null}
        </div>
      </div>

      <div className="rounded-[12px] border border-[rgba(1,10,4,0.08)] bg-white px-[15px] py-5 shadow-[0_3px_15px_rgba(0,0,0,0.06)] sm:px-5">
        <div className="mb-4 flex flex-col gap-3 sm:mb-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <h3 className="text-[20px] font-medium text-[#010a04]">{t("tournaments.scheduleParticipantsTitle")}</h3>
            <SchedulePlayingModeControl
              mode={mode}
              doublesLocked={participants.length < 2 && mode !== "doubles"}
              pairingPending={generateDoublesPairsMutation.isPending && mode === "doubles"}
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
          doublesPairsLoading={generateDoublesPairsMutation.isPending && mode === "doubles"}
          onEditParticipant={() => toast.info(t("common.comingSoon"))}
          onRemoveParticipant={(participantId) => {
            isDirtyRef.current = true;
            setDoublesPairs(null);
            setParticipants((prev) => removeParticipant(prev, participantId));
          }}
          onMoveParticipant={(index, direction) => {
            isDirtyRef.current = true;
            setDoublesPairs(null);
            setParticipants((prev) => moveParticipant(prev, index, direction));
          }}
        />
      </div>
    </div>
  );
}
