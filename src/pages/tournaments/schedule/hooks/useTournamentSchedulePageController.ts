import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";
import type {
  GenerateTournamentDoublesPairsResponse,
  TournamentScheduleMatch,
  TournamentScheduleMode,
} from "@/models/tournament/types";
import {
  useGenerateTournamentDoublesPairs,
  useGenerateTournamentSchedule,
  useTournamentById,
  useTournamentMatches,
  useTournamentSchedule,
} from "@/pages/tournaments/hooks";
import { clampTime24ToBounds, resolveTournamentScheduleTimeBounds } from "@/utils/time";
import {
  capCourtsForParticipants,
  canGenerateSchedule,
  normalizeParticipantRows,
  participantOrderIds,
  reorderParticipantsById,
  removeParticipant,
  type ScheduleParticipantRow,
} from "../helpers/scheduleParticipants";
import {
  getPreviousRoundGate,
  parseRoundQueryParam,
  resolveScheduleInputRound,
} from "../helpers/tournamentRoundWorkflow";

interface UseTournamentSchedulePageControllerParams {
  id: string | null;
  searchParams: URLSearchParams;
}

type ScheduleFieldOverrides = {
  matchDurationMinutes: number;
  breakTimeMinutes: number;
  matchesPerPlayer: number;
  startTime: string;
  mode: TournamentScheduleMode;
  participants: ScheduleParticipantRow[];
  selectedCourtIds: string[];
  doublesPairs: GenerateTournamentDoublesPairsResponse | null;
  doublesPairsKey: string | null;
};

type ScheduleOverrides = Partial<ScheduleFieldOverrides>;

type TournamentScopedOverrides = {
  tournamentId: string | null;
  values: ScheduleOverrides;
};

export function useTournamentSchedulePageController({
  id,
  searchParams,
}: UseTournamentSchedulePageControllerParams) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const scheduleQuery = useTournamentSchedule(id, Boolean(id));
  const tournamentDetailQuery = useTournamentById(id, Boolean(id));
  const matchesQuery = useTournamentMatches(id, Boolean(id));
  const generateScheduleMutation = useGenerateTournamentSchedule();
  const generateDoublesPairsMutation = useGenerateTournamentDoublesPairs();

  const [overrideState, setOverrideState] = useState<TournamentScopedOverrides>({
    tournamentId: null,
    values: {},
  });
  const [isRescheduleWarningOpen, setIsRescheduleWarningOpen] = useState(false);
  const latestDoublesRequestIdRef = useRef(0);

  const updateOverrides = useCallback(
    (updater: (current: ScheduleOverrides) => ScheduleOverrides) => {
      setOverrideState((prev) => {
        const current = prev.tournamentId === id ? prev.values : {};
        return {
          tournamentId: id,
          values: updater(current),
        };
      });
    },
    [id]
  );

  const scopedOverrides: ScheduleOverrides =
    overrideState.tournamentId === id ? overrideState.values : {};

  const isDirty = Object.keys(scopedOverrides).length > 0;

  const scheduleTimeBounds = useMemo(
    () =>
      resolveTournamentScheduleTimeBounds(
        tournamentDetailQuery.data?.tournament.startTime,
        tournamentDetailQuery.data?.tournament.endTime
      ),
    [
      tournamentDetailQuery.data?.tournament.endTime,
      tournamentDetailQuery.data?.tournament.startTime,
    ]
  );

  const isScheduledTournament =
    tournamentDetailQuery.data?.tournament.tournamentMode === "singleDay";

  const scheduleInput = scheduleQuery.data?.scheduleInput;
  const defaultParticipants = useMemo(
    () => normalizeParticipantRows(scheduleQuery.data?.participants ?? []),
    [scheduleQuery.data]
  );
  const defaultSelectedCourtIds = useMemo(
    () =>
      (scheduleInput?.availableCourts ?? [])
        .filter((court) => court.selected)
        .map((court) => court.id),
    [scheduleInput]
  );

  const matchDurationMinutes =
    scopedOverrides.matchDurationMinutes ?? scheduleInput?.matchDurationMinutes ?? 60;
  const breakTimeMinutes = scopedOverrides.breakTimeMinutes ?? scheduleInput?.breakTimeMinutes ?? 5;
  const matchesPerPlayer = scopedOverrides.matchesPerPlayer ?? scheduleInput?.matchesPerPlayer ?? 5;
  const startTime = scopedOverrides.startTime ?? scheduleInput?.startTime ?? "09:00";
  const mode = scopedOverrides.mode ?? scheduleInput?.mode ?? "singles";
  const participants = scopedOverrides.participants ?? defaultParticipants;
  const participantOrderKey = participantOrderIds(participants).join(",");
  const selectedCourtIds = scopedOverrides.selectedCourtIds ?? defaultSelectedCourtIds;
  const doublesPairs = scopedOverrides.doublesPairs ?? null;
  const doublesPairsKey = scopedOverrides.doublesPairsKey ?? null;

  const queryRound = parseRoundQueryParam(searchParams);
  const summaryCurrentRound = scheduleQuery.data?.scheduleSummary.currentRound ?? 0;
  const round = resolveScheduleInputRound(queryRound, summaryCurrentRound);

  const clampedStartTime = useMemo(
    () => clampTime24ToBounds(startTime, scheduleTimeBounds),
    [scheduleTimeBounds, startTime]
  );

  const availableCourts = scheduleQuery.data?.scheduleInput.availableCourts ?? [];
  const tournamentMinimumParticipants =
    tournamentDetailQuery.data?.tournament.minMember ?? Number.POSITIVE_INFINITY;
  const enrolledParticipants = participants.length;
  const meetsTournamentMinimum = enrolledParticipants >= tournamentMinimumParticipants;

  const scheduleRoundGate = useMemo(
    () => getPreviousRoundGate(round, matchesQuery.data?.matches ?? []),
    [matchesQuery.data?.matches, round]
  );

  const roundMatches = useMemo(
    () => (matchesQuery.data?.matches ?? []).filter((match) => match.round === round),
    [matchesQuery.data?.matches, round]
  );
  const isReschedulingExistingRound = roundMatches.length > 0;
  const hasRecordedScoresInRound = useMemo(
    () =>
      roundMatches.some((match: TournamentScheduleMatch) => {
        const p1 = match.score.playerOneScores?.length ?? 0;
        const p2 = match.score.playerTwoScores?.length ?? 0;
        return p1 > 0 || p2 > 0 || match.status === "completed" || match.status === "pendingScore";
      }),
    [roundMatches]
  );
  const scoredMatchesCount = useMemo(
    () =>
      roundMatches.filter((match: TournamentScheduleMatch) => {
        const p1 = match.score.playerOneScores?.length ?? 0;
        const p2 = match.score.playerTwoScores?.length ?? 0;
        return p1 > 0 || p2 > 0 || match.status === "completed" || match.status === "pendingScore";
      }).length,
    [roundMatches]
  );

  const canSubmit =
    selectedCourtIds.length > 0 &&
    meetsTournamentMinimum &&
    canGenerateSchedule(mode, participants.length) &&
    (!scheduleRoundGate.blocked || isReschedulingExistingRound) &&
    !matchesQuery.isLoading &&
    !generateScheduleMutation.isPending;

  const onMatchDurationChange = useCallback((value: number) => {
    updateOverrides((current) => ({
      ...current,
      matchDurationMinutes: value,
    }));
  }, [updateOverrides]);

  const onBreakTimeChange = useCallback((value: number) => {
    updateOverrides((current) => ({
      ...current,
      breakTimeMinutes: value,
    }));
  }, [updateOverrides]);

  const onMatchesPerPlayerChange = useCallback((value: number) => {
    updateOverrides((current) => ({
      ...current,
      matchesPerPlayer: value,
    }));
  }, [updateOverrides]);

  const onStartTimeChange = useCallback((next: string | null) => {
    if (!next) {
      return;
    }
    updateOverrides((current) => ({
      ...current,
      startTime: next,
    }));
  }, [updateOverrides]);

  const onToggleCourt = useCallback((courtId: string) => {
    updateOverrides((current) => {
      const baseSelectedCourts = current.selectedCourtIds ?? defaultSelectedCourtIds;
      const nextSelectedCourts = baseSelectedCourts.includes(courtId)
        ? baseSelectedCourts.filter((idValue) => idValue !== courtId)
        : [...baseSelectedCourts, courtId];

      return {
        ...current,
        selectedCourtIds: nextSelectedCourts,
      };
    });
  }, [defaultSelectedCourtIds, updateOverrides]);

  const onPlayingModeChange = useCallback(
    async (nextMode: TournamentScheduleMode) => {
      if (!id || nextMode === mode) {
        return;
      }

      if (nextMode === "singles") {
        updateOverrides((current) => ({
          ...current,
          mode: "singles",
          doublesPairsKey: null,
        }));
        return;
      }

      if (generateDoublesPairsMutation.isPending || participants.length < 2) {
        if (participants.length < 2) {
          toast.warning(t("tournaments.scheduleDoublesBlockedMinParticipants"));
        }
        return;
      }

      if (doublesPairs && doublesPairsKey === participantOrderKey) {
        updateOverrides((current) => ({
          ...current,
          mode: "doubles",
        }));
        return;
      }

      updateOverrides((current) => ({
        ...current,
        mode: "doubles",
      }));
      const callId = latestDoublesRequestIdRef.current + 1;
      latestDoublesRequestIdRef.current = callId;
      try {
        const response = await generateDoublesPairsMutation.mutateAsync({
          id,
          payload: {
            participantOrder: participantOrderIds(participants),
          },
        });
        updateOverrides((current) => {
          const isStale =
            latestDoublesRequestIdRef.current !== callId || current.mode !== "doubles";
          if (isStale) {
            return current;
          }
          return {
            ...current,
            doublesPairs: response,
            doublesPairsKey: participantOrderKey,
          };
        });
      } catch (error: unknown) {
        updateOverrides((current) => {
          const isStale =
            latestDoublesRequestIdRef.current !== callId || current.mode !== "doubles";
          if (isStale) {
            return current;
          }
          return {
            ...current,
            mode: "singles",
            doublesPairsKey: null,
          };
        });
        if (latestDoublesRequestIdRef.current === callId) {
          toast.error(getErrorMessage(error) ?? t("tournaments.schedulePairsError"));
        }
      }
    },
    [
      doublesPairs,
      doublesPairsKey,
      generateDoublesPairsMutation,
      id,
      mode,
      participantOrderKey,
      participants,
      updateOverrides,
      t,
    ]
  );

  const buildGeneratePayload = useCallback(
    (allowRescheduleWithScores: boolean) => {
      const effectiveCourtIds = capCourtsForParticipants(
        selectedCourtIds,
        mode,
        participants.length
      );

      return {
        payload: {
          round,
          mode,
          matchesPerPlayer,
          startTime: clampedStartTime,
          courtIds: effectiveCourtIds,
          participantOrder: participantOrderIds(participants),
          ...(isScheduledTournament
            ? {
                matchDurationMinutes,
                breakTimeMinutes,
              }
            : {}),
          ...(allowRescheduleWithScores ? { allowRescheduleWithScores: true } : {}),
        },
        effectiveCourtIds,
      };
    },
    [
      breakTimeMinutes,
      clampedStartTime,
      isScheduledTournament,
      matchDurationMinutes,
      matchesPerPlayer,
      mode,
      participants,
      round,
      selectedCourtIds,
    ]
  );

  const submitGenerateSchedule = useCallback(
    async (allowRescheduleWithScores: boolean) => {
      if (!id) {
        return;
      }

      const { payload, effectiveCourtIds } = buildGeneratePayload(allowRescheduleWithScores);
      if (effectiveCourtIds.length < selectedCourtIds.length) {
        toast.info(
          t("tournaments.scheduleCourtsCappedForParticipants", {
            selected: selectedCourtIds.length,
            usable: effectiveCourtIds.length,
          })
        );
      }

      const response = await generateScheduleMutation.mutateAsync({
        id,
        payload,
      });

      toast.success(t("tournaments.scheduleGenerated", { round }));
      navigate(`/tournaments/${id}/match-schedule?round=${response.schedule.round}`);
    },
    [
      buildGeneratePayload,
      generateScheduleMutation,
      id,
      navigate,
      round,
      selectedCourtIds.length,
      t,
    ]
  );

  const onGenerateSchedule = useCallback(async () => {
    if (!id) {
      return;
    }

    if (scheduleRoundGate.blocked && !isReschedulingExistingRound) {
      toast.error(
        scheduleRoundGate.reason === "missing"
          ? t("tournaments.schedulePreviousRoundMissing", {
              round: scheduleRoundGate.previousRound,
            })
          : t("tournaments.schedulePreviousRoundIncomplete", {
              round: scheduleRoundGate.previousRound,
            })
      );
      return;
    }

    if (isReschedulingExistingRound && hasRecordedScoresInRound) {
      setIsRescheduleWarningOpen(true);
      return;
    }

    try {
      await submitGenerateSchedule(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) ?? t("tournaments.scheduleGenerateError"));
    }
  }, [
    hasRecordedScoresInRound,
    id,
    isReschedulingExistingRound,
    scheduleRoundGate,
    submitGenerateSchedule,
    t,
  ]);

  const onCancelRescheduleWarning = useCallback(() => {
    setIsRescheduleWarningOpen(false);
  }, []);

  const onConfirmRescheduleWarning = useCallback(async () => {
    if (!id) {
      setIsRescheduleWarningOpen(false);
      return;
    }
    try {
      await submitGenerateSchedule(true);
      setIsRescheduleWarningOpen(false);
    } catch (error: unknown) {
      const message = getErrorMessage(error) ?? t("tournaments.scheduleGenerateError");
      toast.error(message);
    }
  }, [id, submitGenerateSchedule, t]);

  const onRemoveParticipant = useCallback((participantId: string) => {
    updateOverrides((current) => {
      const baseParticipants = current.participants ?? defaultParticipants;
      return {
        ...current,
        doublesPairs: null,
        doublesPairsKey: null,
        participants: removeParticipant(baseParticipants, participantId),
      };
    });
  }, [defaultParticipants, updateOverrides]);

  const onReorderParticipant = useCallback((activeId: string, overId: string) => {
    updateOverrides((current) => {
      const baseParticipants = current.participants ?? defaultParticipants;
      return {
        ...current,
        doublesPairs: null,
        doublesPairsKey: null,
        participants: reorderParticipantsById(baseParticipants, activeId, overId),
      };
    });
  }, [defaultParticipants, updateOverrides]);

  const onEditParticipant = useCallback(() => {
    toast.info(t("common.comingSoon"));
  }, [t]);

  return {
    scheduleQuery,
    tournamentDetailQuery,
    matchesQuery,
    generateScheduleMutation,
    generateDoublesPairsMutation,
    scheduleTimeBounds,
    isScheduledTournament,
    matchDurationMinutes,
    breakTimeMinutes,
    matchesPerPlayer,
    mode,
    participants,
    selectedCourtIds,
    doublesPairs,
    round,
    clampedStartTime,
    availableCourts,
    isDirty,
    meetsTournamentMinimum,
    scheduleRoundGate,
    isReschedulingExistingRound,
    hasRecordedScoresInRound,
    scoredMatchesCount,
    isRescheduleWarningOpen,
    canSubmit,
    onMatchDurationChange,
    onBreakTimeChange,
    onMatchesPerPlayerChange,
    onStartTimeChange,
    onToggleCourt,
    onPlayingModeChange,
    onGenerateSchedule,
    onConfirmRescheduleWarning,
    onCancelRescheduleWarning,
    onRemoveParticipant,
    onReorderParticipant,
    onEditParticipant,
  };
}
