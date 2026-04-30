import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";
import type {
  GenerateTournamentDoublesPairsResponse,
  TournamentSchedulePairPlayer,
  TournamentScheduleMatch,
  TournamentScheduleMode,
} from "@/models/tournament/types";
import {
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
};

type ScheduleOverrides = Partial<ScheduleFieldOverrides>;

type TournamentScopedOverrides = {
  tournamentId: string | null;
  values: ScheduleOverrides;
};

type DoublesPartnerById = Record<string, string>;

function sanitizeDoublesPartnerById(
  partnerById: DoublesPartnerById,
  participantIds: string[]
): DoublesPartnerById {
  const validIds = new Set(participantIds);
  const next: DoublesPartnerById = {};

  for (const participantId of participantIds) {
    const partnerId = partnerById[participantId];
    if (!partnerId || partnerId === participantId || !validIds.has(partnerId)) {
      continue;
    }
    if (partnerById[partnerId] !== participantId) {
      continue;
    }
    next[participantId] = partnerId;
  }

  return next;
}

function asPairPlayer(participant: ScheduleParticipantRow): TournamentSchedulePairPlayer {
  return {
    id: participant.id,
    name: participant.name,
    alias: participant.alias,
    skillLabel: participant.skillLabel,
    rating: participant.rating,
  };
}

function buildDoublesPairsResponse(
  participants: ScheduleParticipantRow[],
  partnerById: DoublesPartnerById
): GenerateTournamentDoublesPairsResponse {
  const byId = new Map(participants.map((participant) => [participant.id, participant]));
  const used = new Set<string>();
  const teams: GenerateTournamentDoublesPairsResponse["teams"] = [];
  const unpaired: TournamentSchedulePairPlayer[] = [];

  let teamNumber = 1;
  for (const participant of participants) {
    if (used.has(participant.id)) {
      continue;
    }
    const partnerId = partnerById[participant.id];
    const partner = partnerId ? byId.get(partnerId) : undefined;
    if (partner && !used.has(partner.id) && partnerById[partner.id] === participant.id) {
      teams.push({
        team: teamNumber,
        players: [asPairPlayer(participant), asPairPlayer(partner)],
      });
      teamNumber += 1;
      used.add(participant.id);
      used.add(partner.id);
      continue;
    }

    used.add(participant.id);
    unpaired.push(asPairPlayer(participant));
  }

  return { teams, unpaired };
}

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

  const [overrideState, setOverrideState] = useState<TournamentScopedOverrides>({
    tournamentId: null,
    values: {},
  });
  const [isRescheduleWarningOpen, setIsRescheduleWarningOpen] = useState(false);

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
  const selectedCourtIds = scopedOverrides.selectedCourtIds ?? defaultSelectedCourtIds;
  const doublesPartnerById = useMemo(
    () =>
      sanitizeDoublesPartnerById(
        tournamentDetailQuery.data?.tournament.doublesPairs ?? {},
        participants.map((participant) => participant.id)
      ),
    [participants, tournamentDetailQuery.data?.tournament.doublesPairs]
  );
  const doublesPairs: GenerateTournamentDoublesPairsResponse | null = useMemo(
    () => (mode === "doubles" ? buildDoublesPairsResponse(participants, doublesPartnerById) : null),
    [doublesPartnerById, mode, participants]
  );
  const doublesUnpairedCount = mode === "doubles" ? (doublesPairs?.unpaired.length ?? participants.length) : 0;

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
  // Prefer server schedule summary to detect rescheduling even if match list doesn't include everything yet.
  const isReschedulingExistingRound =
    roundMatches.length > 0 || (summaryCurrentRound > 0 && round <= summaryCurrentRound);
  const hasRecordedScoresInRound = useMemo(
    () =>
      roundMatches.some((match: TournamentScheduleMatch) => {
        const p1 = match.score.playerOneScores?.length ?? 0;
        const p2 = match.score.playerTwoScores?.length ?? 0;
        return p1 > 0 || p2 > 0 || match.status === "completed" || match.status === "pendingScore";
      }),
    [roundMatches]
  );
  const scoredMatchesCountBase = useMemo(
    () =>
      roundMatches.filter((match: TournamentScheduleMatch) => {
        const p1 = match.score.playerOneScores?.length ?? 0;
        const p2 = match.score.playerTwoScores?.length ?? 0;
        return p1 > 0 || p2 > 0 || match.status === "completed" || match.status === "pendingScore";
      }).length,
    [roundMatches]
  );

  // Backend emits a deterministic confirmation-required message when a reschedule would overwrite scored matches
  // unless `allowRescheduleWithScores` is confirmed.
  const RESCHEDULE_WITH_SCORES_CONFIRMATION_PREFIX =
    "RESCHEDULE_WITH_SCORES_CONFIRMATION_REQUIRED:";

  const parseBackendRescheduleConfirmation = (
    message: string
  ): { round: number; scoredMatches: number } | null => {
    // Example message:
    // RESCHEDULE_WITH_SCORES_CONFIRMATION_REQUIRED: Round 2 has 3 scored match(es). Confirm ...
    const escapedPrefix = RESCHEDULE_WITH_SCORES_CONFIRMATION_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = message.match(
      new RegExp(
        `${escapedPrefix}\\s*Round\\s+(\\d+)\\s+has\\s+(\\d+)\\s+scored match(?:\\(es\\))?`,
        "i"
      )
    );
    if (!match) return null;

    return {
      round: Number.parseInt(match[1], 10),
      scoredMatches: Number.parseInt(match[2], 10),
    };
  };

  const [backendScoredMatchesCountOverride, setBackendScoredMatchesCountOverride] = useState<number | null>(null);
  const scoredMatchesCount = backendScoredMatchesCountOverride ?? scoredMatchesCountBase;

  const canSubmit =
    selectedCourtIds.length > 0 &&
    meetsTournamentMinimum &&
    canGenerateSchedule(mode, participants.length) &&
    (mode !== "doubles" || doublesUnpairedCount === 0) &&
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
        }));
        return;
      }

      if (participants.length < 2) {
        toast.warning(t("tournaments.scheduleDoublesBlockedMinParticipants"));
        return;
      }

      updateOverrides((current) => ({
        ...current,
        mode: "doubles",
      }));
    },
    [
      mode,
      participants,
      updateOverrides,
      t,
    ]
  );

  const resolveParticipantOrderForGeneration = useCallback(() => {
    const baseOrder = participantOrderIds(participants);
    if (mode !== "doubles") {
      return baseOrder;
    }

    const ordered: string[] = [];
    const used = new Set<string>();

    for (const participantId of baseOrder) {
      if (used.has(participantId)) {
        continue;
      }

      const partnerId = doublesPartnerById[participantId];
      if (partnerId && !used.has(partnerId) && baseOrder.includes(partnerId)) {
        ordered.push(participantId, partnerId);
        used.add(participantId);
        used.add(partnerId);
        continue;
      }

      ordered.push(participantId);
      used.add(participantId);
    }

    return ordered;
  }, [doublesPartnerById, mode, participants]);

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
          participantOrder: resolveParticipantOrderForGeneration(),
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
      resolveParticipantOrderForGeneration,
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
    if (mode === "doubles" && doublesUnpairedCount > 0) {
      toast.error(
        t("tournaments.scheduleDoublesBlockedUnpaired", {
          count: doublesUnpairedCount,
        })
      );
      return;
    }

    try {
      await submitGenerateSchedule(false);
    } catch (error: unknown) {
      const message = getErrorMessage(error) ?? null;
      if (
        message &&
        message.startsWith(RESCHEDULE_WITH_SCORES_CONFIRMATION_PREFIX)
      ) {
        const parsed = parseBackendRescheduleConfirmation(message);
        if (parsed && parsed.round === round) {
          setBackendScoredMatchesCountOverride(parsed.scoredMatches);
          setIsRescheduleWarningOpen(true);
          return;
        }
      }

      toast.error(getErrorMessage(error) ?? t("tournaments.scheduleGenerateError"));
    }
  }, [
    id,
    isReschedulingExistingRound,
    scheduleRoundGate,
    submitGenerateSchedule,
    round,
    parseBackendRescheduleConfirmation,
    RESCHEDULE_WITH_SCORES_CONFIRMATION_PREFIX,
    t,
    mode,
    doublesUnpairedCount,
  ]);

  const onCancelRescheduleWarning = useCallback(() => {
    setIsRescheduleWarningOpen(false);
    setBackendScoredMatchesCountOverride(null);
  }, []);

  const onConfirmRescheduleWarning = useCallback(async () => {
    if (!id) {
      setIsRescheduleWarningOpen(false);
      setBackendScoredMatchesCountOverride(null);
      return;
    }
    try {
      setBackendScoredMatchesCountOverride(null);
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
        participants: removeParticipant(baseParticipants, participantId),
      };
    });
  }, [defaultParticipants, updateOverrides]);

  const onReorderParticipant = useCallback((activeId: string, overId: string) => {
    updateOverrides((current) => {
      const baseParticipants = current.participants ?? defaultParticipants;
      return {
        ...current,
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
    scheduleTimeBounds,
    isScheduledTournament,
    matchDurationMinutes,
    breakTimeMinutes,
    matchesPerPlayer,
    mode,
    participants,
    selectedCourtIds,
    doublesPairs,
    doublesPartnerById,
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
