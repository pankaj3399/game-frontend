import { useCallback, useEffect, useMemo, useState } from "react";
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
  parseRescheduleConfirmed,
  parseRoundQueryParam,
  resolveScheduleInputRound,
} from "../helpers/tournamentRoundWorkflow";
import { resolveDefaultScheduleStartTime } from "../helpers/resolveDefaultScheduleStartTime";
import { hasRecordedMatchScore } from "../utils/matchScheduleScore";

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
    profilePictureUrl: participant.profilePictureUrl,
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

  const queryRound = parseRoundQueryParam(searchParams);
  const rescheduleConfirmed = parseRescheduleConfirmed(searchParams);
  const scheduleQuery = useTournamentSchedule(id, Boolean(id), queryRound);
  const tournamentDetailQuery = useTournamentById(id, Boolean(id));
  const matchesQuery = useTournamentMatches(id, Boolean(id));
  const generateScheduleMutation = useGenerateTournamentSchedule();

  const [overrideState, setOverrideState] = useState<TournamentScopedOverrides>({
    tournamentId: null,
    values: {},
  });
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

  const summaryCurrentRound = scheduleQuery.data?.scheduleSummary.currentRound ?? 0;
  const round = resolveScheduleInputRound(queryRound, summaryCurrentRound);

  // Participant removals are per-round; reset the list when switching rounds.
  useEffect(() => {
    setOverrideState((prev) => {
      if (prev.tournamentId !== id || prev.values.participants == null) {
        return prev;
      }
      const nextValues = { ...prev.values };
      delete nextValues.participants;
      return { tournamentId: id, values: nextValues };
    });
  }, [id, round]);

  const defaultStartTime = useMemo(
    () =>
      resolveDefaultScheduleStartTime({
        targetRound: round,
        tournamentStartTime: tournamentDetailQuery.data?.tournament.startTime,
        matchDurationMinutes,
        matches: matchesQuery.data?.matches ?? [],
        timeZone: tournamentDetailQuery.data?.tournament.timezone,
        fallbackStartTime: scheduleInput?.startTime,
      }),
    [
      matchDurationMinutes,
      matchesQuery.data?.matches,
      round,
      scheduleInput?.startTime,
      tournamentDetailQuery.data?.tournament.startTime,
      tournamentDetailQuery.data?.tournament.timezone,
    ]
  );

  const startTime = scopedOverrides.startTime ?? defaultStartTime;

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
    () => roundMatches.some(hasRecordedMatchScore),
    [roundMatches]
  );

  const allowRescheduleWithScoresOnGenerate =
    isReschedulingExistingRound && (rescheduleConfirmed || hasRecordedScoresInRound);

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

  const resolveParticipantOrderForGeneration = useCallback(
    () => participantOrderIds(participants),
    [participants]
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
      navigate(`/tournaments/${id}?tab=matches&round=${response.schedule.round}`);
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

    try {
      await submitGenerateSchedule(allowRescheduleWithScoresOnGenerate);
    } catch (error: unknown) {
      const message = getErrorMessage(error) ?? null;
      const needsRescheduleConfirmation =
        message?.startsWith("RESCHEDULE_WITH_SCORES_CONFIRMATION_REQUIRED:") === true;

      if (needsRescheduleConfirmation && isReschedulingExistingRound) {
        try {
          await submitGenerateSchedule(true);
          return;
        } catch (retryError: unknown) {
          toast.error(getErrorMessage(retryError) ?? t("tournaments.scheduleGenerateError"));
          return;
        }
      }

      toast.error(getErrorMessage(error) ?? t("tournaments.scheduleGenerateError"));
    }
  }, [
    allowRescheduleWithScoresOnGenerate,
    id,
    isReschedulingExistingRound,
    scheduleRoundGate,
    submitGenerateSchedule,
    t,
  ]);

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
    canSubmit,
    onMatchDurationChange,
    onBreakTimeChange,
    onMatchesPerPlayerChange,
    onStartTimeChange,
    onToggleCourt,
    onPlayingModeChange,
    onGenerateSchedule,
    onRemoveParticipant,
    onReorderParticipant,
  };
}
