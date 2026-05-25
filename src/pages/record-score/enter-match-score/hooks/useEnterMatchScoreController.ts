import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { TFunction } from "i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { queryKeys } from "@/lib/api/queryKeys";
import { getErrorMessage, getHttpStatus } from "@/lib/errors";
import {
  playScoreQrScanSound,
  preloadScoreQrScanSound,
  unlockScoreQrScanSound,
} from "@/lib/scoreQrScanSound";
import { shareDataWithUrlInText } from "@/lib/webShare";
import { useTournamentById } from "@/pages/tournaments/hooks/useTournamentById";
import { useTournamentLiveMatch } from "@/pages/tournaments/hooks/useTournamentLiveMatch";
import { useTournamentMatches } from "@/pages/tournaments/hooks/useTournamentMatches";
import {
  useActiveTournamentScoreQrSession,
  invalidateQueriesAfterTournamentScoreConfirm,
  useConfirmTournamentScoreQr,
  useGenerateIndependentScoreQr,
  useGenerateTournamentScoreQr,
  useUpdateScoreQrScores,
  useValidateTournamentScoreQrConfirmContext,
  useCancelActiveScoreQr,
  useScoreQrConfirmContextEvents,
} from "@/pages/tournaments/hooks/useTournamentScoreQr";
import {
  applyScoreInputChange,
  buildScorePayload,
  createScoreEditorRowsFromPersistedScores,
  hasRecordedMatchScore,
  type ScoreEditorRow,
  type ScoreEditorSide,
} from "@/pages/tournaments/schedule/utils/matchScheduleScore";
import {
  mapCanonicalScoresToViewerPerspective,
  swapTournamentScorePair,
} from "@/pages/tournaments/schedule/utils/tournamentScorePerspective";
import { teamSideDisplayName } from "@/pages/tournaments/schedule/utils/matchTeamDisplay";
import type {
  RecordTournamentMatchScoreInput,
  TournamentLiveMatchItem,
  TournamentMatchPlayer,
  TournamentScheduleMatch,
} from "@/models/tournament/types";
import type { AuthUser } from "@/contexts/auth/context";
import {
  buildMatchLabel,
  buildTournamentScopedMatchLabel,
  createRowsForPlayMode,
  formatExpiry,
  formatLiveMatchTeamLabel,
  isScorableMatchOption,
  liveMatchHasRecordedScore,
  normalizeDisplayName,
  normalizeDisplayNameForLabel,
  pickDefaultScorableTournamentOption,
  playerDisplayName,
  sortTournamentMatchOptionsByStartTimeDesc,
} from "../helpers";
import { INDEPENDENT_MATCH_ID, type MatchOption } from "../types";
import {
  buildConfirmScoreQrLocationAfterTokenPromotion,
  clearScoreQrToken,
  pruneScoreQrToken,
  readScoreQrToken,
} from "../../scoreQrTokenSession";

function createRowsFromScorePayload(
  playerOneScores: Array<number | "wo" | null>,
  playerTwoScores: Array<number | "wo" | null>,
  playMode: MatchOption["playMode"],
  layout: "schedule" | "recordScore",
): ScoreEditorRow[] {
  return createScoreEditorRowsFromPersistedScores(
    playerOneScores,
    playerTwoScores,
    playMode,
    layout,
  );
}

function teamIncludesUser(
  team: readonly [TournamentMatchPlayer | null, TournamentMatchPlayer | null],
  userId: string | null,
): boolean {
  if (!userId) return false;
  return team.some((player) => player?.id === userId);
}

function firstTeamAvatarUrl(
  team: readonly [TournamentMatchPlayer | null, TournamentMatchPlayer | null],
): string | null {
  const player = team.find((item): item is TournamentMatchPlayer => item != null);
  return player?.profilePictureUrl ?? null;
}

type UseEnterMatchScoreControllerParams = {
  t: TFunction;
  language: string;
  user: AuthUser | null;
};

export function useEnterMatchScoreController({
  t,
  language,
  user,
}: UseEnterMatchScoreControllerParams) {
  const userId = user?.id ?? null;
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const mode = searchParams.get("mode") === "confirm" ? "confirm" : "generate";
  const confirmedTokenFromQuery = searchParams.get("token")?.trim() ?? "";
  const confirmedTokenFromScoreQrQuery =
    searchParams.get("scoreQrToken")?.trim() ?? "";
  const confirmedTokenRef = searchParams.get("qrRef")?.trim() ?? "";
  const confirmedTokenFromRef = readScoreQrToken(confirmedTokenRef);
  const confirmedTokenFromNavigationState =
    typeof (location.state as { scoreQrToken?: unknown } | null)?.scoreQrToken ===
    "string"
      ? String((location.state as { scoreQrToken: string }).scoreQrToken).trim()
      : "";
  const confirmedToken =
    mode === "confirm"
      ? confirmedTokenFromRef ||
        confirmedTokenFromNavigationState ||
        confirmedTokenFromScoreQrQuery ||
        confirmedTokenFromQuery
      : "";
  const forcedMatchId = searchParams.get("matchId")?.trim() ?? "";
  const forcedTournamentId = searchParams.get("tournamentId")?.trim() ?? "";
  const manualPrefillTournamentName = searchParams.get("tournamentName")?.trim() ?? "";
  const preferredGenerateMatchId = mode === "generate" ? forcedMatchId : "";
  const preferredGenerateTournamentId = mode === "generate" ? forcedTournamentId : "";
  const hasManualPrefill =
    mode === "generate" && Boolean(forcedMatchId && forcedTournamentId);

  /** After Confirm score succeeds, skip invalid-confirm redirects/toasts while navigating away. */
  const [confirmSubmitFinished, setConfirmSubmitFinished] = useState(false);

  useEffect(() => {
    setConfirmSubmitFinished(false);
  }, [mode, confirmedToken]);

  const liveMatchQuery = useTournamentLiveMatch(true);
  const confirmContextEnabled =
    mode === "confirm" && Boolean(confirmedToken) && !confirmSubmitFinished;
  const validatedScoreQuery = useValidateTournamentScoreQrConfirmContext(
    confirmedToken,
    confirmContextEnabled,
  );
  useScoreQrConfirmContextEvents(confirmedToken, confirmContextEnabled);

  useEffect(() => {
    if (mode !== "confirm") return;
    preloadScoreQrScanSound();
  }, [mode]);
  const generateTournamentQrMutation = useGenerateTournamentScoreQr();
  const generateIndependentQrMutation = useGenerateIndependentScoreQr();
  const updateScoreQrMutation = useUpdateScoreQrScores();
  const confirmScoreQrMutation = useConfirmTournamentScoreQr();
  const validatedRequest = validatedScoreQuery.data?.request ?? null;

  const [isMatchPopoverOpen, setIsMatchPopoverOpen] = useState(false);
  const [openScorePickerKey, setOpenScorePickerKey] = useState<string | null>(null);
  const [matchSearch, setMatchSearch] = useState("");
  const [generatedQrDataUrl, setGeneratedQrDataUrl] = useState<string | null>(null);
  const [generatedValidationUrl, setGeneratedValidationUrl] = useState<string | null>(null);
  const [generatedExpiresAt, setGeneratedExpiresAt] = useState<string | null>(null);
  const [generatedRequestId, setGeneratedRequestId] = useState<string | null>(null);
  const [hasUnsavedQrChanges, setHasUnsavedQrChanges] = useState(false);
  const [independentPlayMode, setIndependentPlayMode] =
    useState<MatchOption["playMode"]>("TieBreak10");
  const lastAutoGeneratedQrKeyRef = useRef<string | null>(null);
  /** Prevents the auto-generate effect from scheduling duplicate attempts for the same request key after a failed mutation. */
  const attemptedAutoQrKeyRef = useRef<string | null>(null);
  const skippedScoredMatchRef = useRef(false);
  /** Blocks auto-generate after the opponent consumes the QR (avoids regen on completed match). */
  const [qrSessionConsumed, setQrSessionConsumed] = useState(false);
  /** Hides matches immediately after QR consumption until live-match refetch settles. */
  const [excludedEnterScoreMatchIds, setExcludedEnterScoreMatchIds] = useState(
    () => new Set<string>(),
  );
  /** Keeps the last non-empty tournament title per match across live-match refetches (API can briefly omit names). */
  const lastNonEmptyTournamentNameByMatchIdRef = useRef(new Map<string, string>());
  /** Keeps the last non-empty tournament title per tournament id (confirm / validate flows). */
  const lastNonEmptyTournamentNameByTournamentIdRef = useRef(new Map<string, string>());
  /**
   * Always holds the latest currentQrRequestKey so async callbacks (onGenerateQr) can
   * write the correct key into lastAutoGeneratedQrKeyRef even when the value changed
   * during the network round-trip (e.g. due to a liveMatch refetch shifting the selection).
   */
  const currentQrRequestKeyRef = useRef<string>("");
  const [lastSyncedQrRequestKey, setLastSyncedQrRequestKey] = useState<string | null>(
    null,
  );
  const hadPendingQrSessionRef = useRef(false);
  /** Last server request id while a pending QR session was visible (for confirm vs sync detection). */
  const lastTrackedQrRequestIdRef = useRef<string | null>(null);

  const mergeStableTournamentNameForLabel = useCallback(
    (match: TournamentLiveMatchItem): TournamentLiveMatchItem => {
      const nameByMatch = lastNonEmptyTournamentNameByMatchIdRef.current;
      const rawName = normalizeDisplayName(match.tournament?.name ?? "");
      const cached = nameByMatch.get(match.id) ?? "";
      const stableName = rawName || cached;
      if (rawName) nameByMatch.set(match.id, rawName);
      return {
        ...match,
        tournament: {
          ...match.tournament,
          name: stableName || match.tournament.name || "",
        },
      };
    },
    [],
  );

  const resolvedConfirmMatchId = forcedMatchId || validatedRequest?.matchId || "";
  const resolvedConfirmTournamentId =
    forcedTournamentId || validatedRequest?.tournamentId || "";
  const confirmTournamentDetailQuery = useTournamentById(
    resolvedConfirmTournamentId || null,
    mode === "confirm" && Boolean(resolvedConfirmTournamentId),
  );

  // Strip raw token query params as soon as possible (secret should not live in the address bar).
  useLayoutEffect(() => {
    if (mode !== "confirm" || !confirmedToken) return;

    const params = new URLSearchParams(location.search);
    const rawTokenParam = params.get("token")?.trim() ?? "";
    const rawScoreQrParam = params.get("scoreQrToken")?.trim() ?? "";
    const hasRawTokenInUrl =
      (rawTokenParam && rawTokenParam === confirmedToken) ||
      (rawScoreQrParam && rawScoreQrParam === confirmedToken);
    if (!hasRawTokenInUrl) return;

    const { search, navigationState } = buildConfirmScoreQrLocationAfterTokenPromotion(
      params,
      confirmedToken,
    );

    navigate(
      {
        pathname: location.pathname,
        search,
        hash: location.hash,
      },
      navigationState != null
        ? { replace: true, state: navigationState }
        : { replace: true },
    );
  }, [confirmedToken, mode, navigate, location.pathname, location.search, location.hash]);

  useEffect(() => {
    if (mode !== "confirm" || !confirmedTokenRef) return;
    if (readScoreQrToken(confirmedTokenRef)) return;
    pruneScoreQrToken(confirmedTokenRef);
  }, [mode, confirmedTokenRef]);

  const liveMatch = liveMatchQuery.data?.liveMatch ?? null;
  const inFlightMatches = useMemo(
    () => liveMatchQuery.data?.matches ?? [],
    [liveMatchQuery.data?.matches],
  );
  const eligibleTournaments = useMemo(
    () => liveMatchQuery.data?.eligibleTournaments ?? [],
    [liveMatchQuery.data?.eligibleTournaments],
  );

  const prefillMatchInLiveList = useMemo(() => {
    if (!preferredGenerateMatchId) return true;
    return inFlightMatches.some((match) => match.id === preferredGenerateMatchId);
  }, [inFlightMatches, preferredGenerateMatchId]);

  const needsScheduleForDeepLink =
    mode === "generate" &&
    hasManualPrefill &&
    liveMatchQuery.isSuccess &&
    !prefillMatchInLiveList &&
    Boolean(preferredGenerateTournamentId);

  const confirmScheduleTournamentId =
    mode === "confirm" && resolvedConfirmTournamentId
      ? resolvedConfirmTournamentId
      : null;
  const deepLinkScheduleTournamentId = needsScheduleForDeepLink
    ? preferredGenerateTournamentId
    : null;

  const tournamentScheduleMatchesQuery = useTournamentMatches(
    confirmScheduleTournamentId ?? deepLinkScheduleTournamentId,
    Boolean(confirmScheduleTournamentId ?? deepLinkScheduleTournamentId),
  );

  const urlTournamentName = searchParams.get("tournamentName")?.trim() ?? "";

  // Read-only cache populated in the committed effect below (lastNonEmptyTournamentNameByTournamentIdRef.set).
  const lastNonEmptyTournamentNameForConfirm = resolvedConfirmTournamentId
    ? // eslint-disable-next-line react-hooks/refs -- intentional read of ref cache written in committed effect
      lastNonEmptyTournamentNameByTournamentIdRef.current.get(resolvedConfirmTournamentId)
    : undefined;

  const resolvedConfirmTournamentName = useMemo(() => {
    const tournamentId = resolvedConfirmTournamentId;
    if (!tournamentId) return "";

    const candidates = [
      validatedRequest?.tournamentName,
      confirmTournamentDetailQuery.data?.tournament.name,
      urlTournamentName,
      eligibleTournaments.find((tournament) => tournament.id === tournamentId)?.name,
      inFlightMatches.find((match) => match.tournament.id === tournamentId)?.tournament.name,
      lastNonEmptyTournamentNameForConfirm,
    ];

    for (const raw of candidates) {
      const trimmed = normalizeDisplayName(raw ?? "");
      if (trimmed) {
        return trimmed;
      }
    }

    return "";
  }, [
    confirmTournamentDetailQuery.data?.tournament.name,
    eligibleTournaments,
    inFlightMatches,
    lastNonEmptyTournamentNameForConfirm,
    resolvedConfirmTournamentId,
    urlTournamentName,
    validatedRequest?.tournamentName,
  ]);

  useEffect(() => {
    const tournamentId = resolvedConfirmTournamentId;
    const trimmed = normalizeDisplayName(resolvedConfirmTournamentName);
    if (!tournamentId || !trimmed) return;
    lastNonEmptyTournamentNameByTournamentIdRef.current.set(tournamentId, trimmed);
  }, [resolvedConfirmTournamentId, resolvedConfirmTournamentName]);

  const independentOption = useMemo<MatchOption>(
    () => ({
      id: INDEPENDENT_MATCH_ID,
      label: t("recordScorePage.enter.independentMatch"),
      startTime: null,
      playMode: independentPlayMode,
      mode: "singles",
      kind: "independent",
      tournamentId: null,
      matchId: null,
      isLive: false,
      isPendingScore: false,
      round: null,
      playerOneRowLabel: user
        ? playerDisplayName(user, t("recordScorePage.enter.independentYourTeam"), false)
        : t("recordScorePage.enter.independentYourTeam"),
      playerTwoRowLabel: t("recordScorePage.enter.independentOpponentTeam"),
      playerOneAvatarUrl: user?.profilePictureUrl ?? null,
      playerTwoAvatarUrl: null,
    }),
    [independentPlayMode, t, user],
  );

  const tournamentMatchOptions = useMemo<MatchOption[]>(() => {
    const normalizedLiveMatchId = liveMatch?.id ?? null;
    const options = inFlightMatches
      .filter((match) => match.tournament.id != null)
      .filter((match) => !excludedEnterScoreMatchIds.has(match.id))
      .filter((match) => {
        if (!userId) return true;
        return (
          match.myTeam.some((player) => player.id === userId) ||
          match.opponentTeam.some((player) => player.id === userId)
        );
      })
      .map(
        (match): MatchOption => ({
          id: match.id,
          label: buildMatchLabel(t, mergeStableTournamentNameForLabel(match)),
          startTime: match.startTime,
          playMode: match.playMode ?? "TieBreak10",
          mode: match.mode,
          kind: "tournament",
          tournamentId: match.tournament.id,
          matchId: match.id,
          round: match.round,
          playerOneRowLabel: formatLiveMatchTeamLabel(match.myTeam, t),
          playerTwoRowLabel: formatLiveMatchTeamLabel(match.opponentTeam, t),
          playerOneAvatarUrl: match.myTeam[0]?.profilePictureUrl ?? null,
          playerTwoAvatarUrl: match.opponentTeam[0]?.profilePictureUrl ?? null,
          isLive:
            match.status === "inProgress" ||
            (normalizedLiveMatchId != null && match.id === normalizedLiveMatchId),
          isPendingScore: match.status === "pendingScore",
          hasRecordedScore: liveMatchHasRecordedScore(match),
          scoreRowPerspective: "viewer",
        }),
      );

    return sortTournamentMatchOptionsByStartTimeDesc(options);
  }, [
    excludedEnterScoreMatchIds,
    inFlightMatches,
    liveMatch?.id,
    mergeStableTournamentNameForLabel,
    t,
    userId,
  ]);

  const deepLinkScheduleMatchOption = useMemo<MatchOption | null>(() => {
    if (!needsScheduleForDeepLink || !preferredGenerateMatchId) {
      return null;
    }

    const match =
      tournamentScheduleMatchesQuery.data?.matches.find(
        (item: TournamentScheduleMatch) => item.id === preferredGenerateMatchId,
      ) ?? null;
    if (!match) return null;

    const requesterInSide2 = teamIncludesUser(match.side2, userId);
    const requesterSide = requesterInSide2 ? match.side2 : match.side1;
    const opponentSide = requesterInSide2 ? match.side1 : match.side2;
    const requesterLabel = teamSideDisplayName(match, requesterInSide2 ? 1 : 0, t);
    const opponentLabel = teamSideDisplayName(match, requesterInSide2 ? 0 : 1, t);
    const tournamentName =
      normalizeDisplayNameForLabel(manualPrefillTournamentName, 40) ||
      t("recordScorePage.enter.validatedMatchFallback", {
        defaultValue: "Selected tournament",
      });
    const opponentName =
      normalizeDisplayNameForLabel(opponentLabel, 40) ||
      t("tournaments.opponentUnknown");

    return {
      id: match.id,
      label: `${tournamentName} · ${opponentName}`,
      startTime: match.startTime,
      playMode: match.playMode,
      mode: match.mode ?? "singles",
      kind: "tournament",
      tournamentId: preferredGenerateTournamentId,
      matchId: match.id,
      round: match.round,
      playerOneRowLabel:
        normalizeDisplayNameForLabel(requesterLabel, 50) ||
        t("recordScorePage.enter.myScore"),
      playerTwoRowLabel: opponentName,
      playerOneAvatarUrl: firstTeamAvatarUrl(requesterSide),
      playerTwoAvatarUrl: firstTeamAvatarUrl(opponentSide),
      isLive: match.status === "inProgress",
      isPendingScore: match.status === "pendingScore",
      hasRecordedScore: hasRecordedMatchScore(match),
      scoreRowPerspective: "viewer",
    };
  }, [
    tournamentScheduleMatchesQuery.data?.matches,
    manualPrefillTournamentName,
    needsScheduleForDeepLink,
    preferredGenerateMatchId,
    preferredGenerateTournamentId,
    t,
    userId,
  ]);

  const matchOptions = useMemo(() => {
    const tournamentRows = [...tournamentMatchOptions];
    if (
      deepLinkScheduleMatchOption &&
      !deepLinkScheduleMatchOption.hasRecordedScore &&
      !tournamentRows.some(
        (option) => option.matchId === deepLinkScheduleMatchOption.matchId,
      )
    ) {
      tournamentRows.unshift(deepLinkScheduleMatchOption);
    }
    return [...tournamentRows, independentOption];
  }, [deepLinkScheduleMatchOption, independentOption, tournamentMatchOptions]);

  const forcedOption = useMemo(() => {
    if (mode !== "confirm") return null;
    if (!resolvedConfirmMatchId || !validatedRequest) return null;

    if (validatedRequest.flow === "tournament") {
      if (
        resolvedConfirmTournamentId &&
        tournamentScheduleMatchesQuery.isPending
      ) {
        return null;
      }

      const scheduleMatch =
        tournamentScheduleMatchesQuery.data?.matches.find(
          (item: TournamentScheduleMatch) => item.id === resolvedConfirmMatchId,
        ) ?? null;

      if (scheduleMatch) {
        const sideOneLabel =
          normalizeDisplayNameForLabel(teamSideDisplayName(scheduleMatch, 0, t), 50) ||
          t("recordScorePage.enter.myScore");
        const sideTwoLabel =
          normalizeDisplayNameForLabel(teamSideDisplayName(scheduleMatch, 1, t), 50) ||
          t("recordScorePage.enter.opponentScore");
        const matchLabel = buildTournamentScopedMatchLabel(
          t,
          resolvedConfirmTournamentName,
          `${sideOneLabel} · ${sideTwoLabel}`,
        );

        return {
          id: resolvedConfirmMatchId,
          label: matchLabel,
          startTime: scheduleMatch.startTime,
          playMode: validatedRequest.playMode,
          mode: validatedRequest.matchType,
          kind: "tournament" as const,
          tournamentId: validatedRequest.tournamentId,
          matchId: validatedRequest.matchId,
          round: scheduleMatch.round,
          playerOneRowLabel: sideOneLabel,
          playerTwoRowLabel: sideTwoLabel,
          playerOneAvatarUrl: firstTeamAvatarUrl(scheduleMatch.side1),
          playerTwoAvatarUrl: firstTeamAvatarUrl(scheduleMatch.side2),
          isLive: false,
          isPendingScore: true,
          scoreRowPerspective: "canonical",
        } satisfies MatchOption;
      }
    }

    const existingOption =
      matchOptions.find(
        (option) =>
          option.matchId === resolvedConfirmMatchId &&
          (option.tournamentId ?? "") === (resolvedConfirmTournamentId ?? ""),
      ) ?? null;
    if (existingOption) return existingOption;

    if (validatedRequest.flow === "tournament" && liveMatchQuery.isPending) {
      return null;
    }

    const matchedLiveItem =
      inFlightMatches.find((item) => item.id === resolvedConfirmMatchId) ?? null;

    // For independent flow in confirm mode: the confirmer is the "opponent" (playerTwo).
    // playerOneScores = requester's scores, playerTwoScores = confirmer's scores.
    // We swap perspective so the confirmer sees their own score as the top row.
    const isIndependentConfirm =
      validatedRequest.flow === "independent" &&
      userId !== null &&
      userId !== validatedRequest.requestByUserId;

    // Requester profile from the API response (filled in by backend).
    const requesterProfile = validatedRequest.requestByUserProfile ?? null;
    const requesterDisplayName = requesterProfile
      ? playerDisplayName(
          requesterProfile,
          t("recordScorePage.enter.opponentScore"),
          false,
        )
      : t("recordScorePage.enter.opponentScore");
    const confirmerDisplayName = user
      ? playerDisplayName(user, t("recordScorePage.enter.myScore"), false)
      : t("recordScorePage.enter.myScore");

    if (isIndependentConfirm) {
      // Swap: confirmer on top (playerOne row), requester on bottom (playerTwo row).
      return {
        id: resolvedConfirmMatchId,
        label: t("recordScorePage.enter.validatedMatchFallback", {
          defaultValue: "Validated match",
        }),
        startTime: null,
        playMode: validatedRequest.playMode,
        mode: validatedRequest.matchType,
        kind: "independent" as const,
        tournamentId: null,
        matchId: validatedRequest.matchId,
        round: null,
        playerOneRowLabel: confirmerDisplayName,
        playerTwoRowLabel: requesterDisplayName,
        playerOneAvatarUrl: user?.profilePictureUrl ?? null,
        playerTwoAvatarUrl: requesterProfile?.profilePictureUrl ?? null,
        isLive: false,
        isPendingScore: true,
        scoreRowPerspective: "viewer",
      } satisfies MatchOption;
    }

    const isTournamentConfirmer =
      validatedRequest.flow === "tournament" &&
      userId !== null &&
      userId !== validatedRequest.requestByUserId;
    const fallbackOpponentLabel =
      matchedLiveItem != null
        ? formatLiveMatchTeamLabel(matchedLiveItem.opponentTeam, t)
        : requesterDisplayName;
    const viewerRowLabel = user
      ? playerDisplayName(user, t("recordScorePage.enter.myScore"), false)
      : t("recordScorePage.enter.myScore");

    return {
      id: resolvedConfirmMatchId,
      label:
        matchedLiveItem != null
          ? buildMatchLabel(t, mergeStableTournamentNameForLabel(matchedLiveItem))
          : buildTournamentScopedMatchLabel(
              t,
              resolvedConfirmTournamentName,
              fallbackOpponentLabel,
            ),
      startTime: matchedLiveItem?.startTime ?? null,
      playMode: validatedRequest.playMode,
      mode: validatedRequest.matchType,
      kind: validatedRequest.tournamentId ? "tournament" : "independent",
      tournamentId: validatedRequest.tournamentId,
      matchId: validatedRequest.matchId,
      round: matchedLiveItem?.round ?? null,
      playerOneRowLabel:
        matchedLiveItem != null
          ? formatLiveMatchTeamLabel(matchedLiveItem.myTeam, t)
          : isTournamentConfirmer
            ? viewerRowLabel
            : requesterDisplayName,
      playerTwoRowLabel:
        matchedLiveItem != null
          ? formatLiveMatchTeamLabel(matchedLiveItem.opponentTeam, t)
          : isTournamentConfirmer
            ? requesterDisplayName
            : viewerRowLabel,
      playerOneAvatarUrl:
        matchedLiveItem?.myTeam[0]?.profilePictureUrl ??
        (isTournamentConfirmer ? (user?.profilePictureUrl ?? null) : requesterProfile?.profilePictureUrl ?? null),
      playerTwoAvatarUrl:
        matchedLiveItem?.opponentTeam[0]?.profilePictureUrl ??
        (isTournamentConfirmer ? (requesterProfile?.profilePictureUrl ?? null) : user?.profilePictureUrl ?? null),
      isLive: false,
      isPendingScore: true,
      scoreRowPerspective: "viewer",
    } satisfies MatchOption;
  }, [
    tournamentScheduleMatchesQuery.data?.matches,
    tournamentScheduleMatchesQuery.isPending,
    inFlightMatches,
    liveMatchQuery.isPending,
    matchOptions,
    mergeStableTournamentNameForLabel,
    mode,
    resolvedConfirmMatchId,
    resolvedConfirmTournamentId,
    resolvedConfirmTournamentName,
    t,
    user,
    userId,
    validatedRequest,
  ]);

  const defaultOption = useMemo(() => {
    return (
      forcedOption ??
      pickDefaultScorableTournamentOption(tournamentMatchOptions) ??
      independentOption
    );
  }, [forcedOption, independentOption, tournamentMatchOptions]);

  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const preferredGenerateOption = useMemo(() => {
    if (!preferredGenerateMatchId) return null;

    const matchesPrefill = (option: MatchOption) =>
      option.kind === "tournament" &&
      option.matchId === preferredGenerateMatchId &&
      (!preferredGenerateTournamentId ||
        (option.tournamentId ?? "") === preferredGenerateTournamentId);

    return matchOptions.find(matchesPrefill) ?? null;
  }, [matchOptions, preferredGenerateMatchId, preferredGenerateTournamentId]);
  const resolvedSelectedMatchId = selectedMatchId ?? defaultOption.id;

  const selectableMatchOptions = useMemo(() => {
    if (mode === "confirm") return matchOptions;
    return matchOptions.filter(isScorableMatchOption);
  }, [matchOptions, mode]);

  const filteredMatchOptions = useMemo(() => {
    const query = matchSearch.trim().toLowerCase();
    if (!query) return selectableMatchOptions;
    return selectableMatchOptions.filter((option) =>
      option.label.toLowerCase().includes(query),
    );
  }, [matchSearch, selectableMatchOptions]);

  const effectiveSelectedOption = useMemo(() => {
    if (mode === "confirm" && forcedOption) return forcedOption;
    if (
      mode === "generate" &&
      selectedMatchId == null &&
      preferredGenerateOption &&
      isScorableMatchOption(preferredGenerateOption)
    ) {
      return preferredGenerateOption;
    }
    const resolved =
      selectableMatchOptions.find((option) => option.id === resolvedSelectedMatchId) ??
      (mode === "confirm"
        ? (matchOptions.find((option) => option.id === resolvedSelectedMatchId) ??
          forcedOption)
        : null) ??
      defaultOption;
    if (mode === "generate" && !isScorableMatchOption(resolved)) {
      return defaultOption;
    }
    return resolved;
  }, [
    defaultOption,
    forcedOption,
    matchOptions,
    mode,
    preferredGenerateOption,
    resolvedSelectedMatchId,
    selectableMatchOptions,
    selectedMatchId,
  ]);

  const activeSessionQueryInput = useMemo(() => {
    if (mode !== "generate") return undefined;
    if (effectiveSelectedOption.kind === "tournament") {
      if (!effectiveSelectedOption.matchId || !effectiveSelectedOption.tournamentId) {
        return undefined;
      }
      return {
        flow: "tournament" as const,
        tournamentId: effectiveSelectedOption.tournamentId,
        matchId: effectiveSelectedOption.matchId,
        playMode: effectiveSelectedOption.playMode,
        matchType: effectiveSelectedOption.mode,
      };
    }
    return {
      flow: "independent" as const,
      playMode: effectiveSelectedOption.playMode,
      matchType: effectiveSelectedOption.mode,
    };
  }, [effectiveSelectedOption, mode]);

  const hasLocalGeneratedQr = Boolean(
    generatedValidationUrl || generatedQrDataUrl || generatedRequestId,
  );
  const activeSessionQuery = useActiveTournamentScoreQrSession(
    activeSessionQueryInput,
    mode === "generate" && Boolean(activeSessionQueryInput),
    mode === "generate" && (hasLocalGeneratedQr || Boolean(activeSessionQueryInput))
      ? 3_000
      : 8_000,
  );
  const hydrationScheduleTournamentId =
    mode === "generate" &&
    activeSessionQueryInput?.flow === "tournament" &&
    activeSessionQueryInput.tournamentId &&
    !confirmScheduleTournamentId &&
    !deepLinkScheduleTournamentId
      ? activeSessionQueryInput.tournamentId
      : null;
  const hydrationScheduleMatchesQuery = useTournamentMatches(
    hydrationScheduleTournamentId,
    Boolean(hydrationScheduleTournamentId),
  );
  const scheduleMatchesForPerspective = useMemo(
    () =>
      tournamentScheduleMatchesQuery.data?.matches ??
      hydrationScheduleMatchesQuery.data?.matches ??
      [],
    [
      hydrationScheduleMatchesQuery.data?.matches,
      tournamentScheduleMatchesQuery.data?.matches,
    ],
  );
  const hydratedQrSession = activeSessionQuery.data?.session ?? null;

  const qrSessionMatchesSelection = useMemo(() => {
    if (!hydratedQrSession) return true;
    if (effectiveSelectedOption.kind === "independent") {
      return (
        hydratedQrSession.flow === "independent" &&
        hydratedQrSession.playMode === effectiveSelectedOption.playMode &&
        hydratedQrSession.matchType === effectiveSelectedOption.mode
      );
    }
    return (
      hydratedQrSession.flow === "tournament" &&
      hydratedQrSession.matchId === effectiveSelectedOption.matchId &&
      (hydratedQrSession.tournamentId ?? "") ===
        (effectiveSelectedOption.tournamentId ?? "")
    );
  }, [effectiveSelectedOption, hydratedQrSession]);

  const hasPendingQrSession = Boolean(hydratedQrSession && qrSessionMatchesSelection);

  // Once hydratedQrSession resolves the opponent profile (B opened the link),
  // patch row 2's label and avatar in the independent generate view — done here
  // (after hydratedQrSession is defined) to avoid a circular dependency with independentOption.
  const enrichedSelectedOption = useMemo<typeof effectiveSelectedOption>(() => {
    if (
      mode !== "generate" ||
      effectiveSelectedOption.kind !== "independent" ||
      !hydratedQrSession?.opponentUserProfile
    ) {
      return effectiveSelectedOption;
    }
    const prof = hydratedQrSession.opponentUserProfile;
    return {
      ...effectiveSelectedOption,
      playerTwoRowLabel: playerDisplayName(
        prof,
        t("recordScorePage.enter.independentOpponentTeam"),
        false,
      ),
      playerTwoAvatarUrl: prof.profilePictureUrl ?? null,
    };
  }, [effectiveSelectedOption, hydratedQrSession, mode, t]);

  const scoreDraftMatchKey = effectiveSelectedOption.id;
  const baselineScoreRows = useMemo(
    () => createRowsForPlayMode(effectiveSelectedOption.playMode),
    [effectiveSelectedOption],
  );

  const [scoreDraftRows, setScoreDraftRows] = useState<{
    matchKey: string;
    rows: ScoreEditorRow[];
  } | null>(null);

  const rows =
    scoreDraftRows != null && scoreDraftRows.matchKey === scoreDraftMatchKey
      ? scoreDraftRows.rows
      : baselineScoreRows;

  const isConfirmLocked = mode === "confirm";
  const isValidatedContextOk =
    mode !== "confirm" ||
    Boolean(
      resolvedConfirmMatchId &&
        effectiveSelectedOption.matchId === resolvedConfirmMatchId &&
        (effectiveSelectedOption.tournamentId ?? "") ===
          (resolvedConfirmTournamentId ?? ""),
    );
  const unreadableQrRefWithoutTokenFallback =
    mode === "confirm" &&
    Boolean(confirmedTokenRef.trim()) &&
    !readScoreQrToken(confirmedTokenRef) &&
    !confirmedTokenFromNavigationState &&
    !confirmedTokenFromScoreQrQuery &&
    !confirmedTokenFromQuery;

  const isGenerating =
    generateTournamentQrMutation.isPending ||
    generateIndependentQrMutation.isPending ||
    updateScoreQrMutation.isPending;
  const canGenerateQr =
    mode === "generate" &&
    !effectiveSelectedOption.hasRecordedScore &&
    (effectiveSelectedOption.kind === "independent" ||
      Boolean(
        effectiveSelectedOption.tournamentId && effectiveSelectedOption.matchId,
      ));
  const canSubmitConfirmedScore =
    mode === "confirm" &&
    Boolean(confirmedToken) &&
    Boolean(validatedRequest) &&
    isValidatedContextOk &&
    Boolean(
      effectiveSelectedOption.matchId &&
        (validatedRequest?.flow === "independent" ||
          effectiveSelectedOption.tournamentId),
    );

  const effectiveValidationUrl = useMemo(() => {
    if (mode === "confirm") return null;
    return generatedValidationUrl;
  }, [generatedValidationUrl, mode]);

  const effectiveExpiresAt = useMemo(
    () =>
      mode === "confirm" ? (validatedRequest?.expiresAt ?? null) : generatedExpiresAt,
    [generatedExpiresAt, mode, validatedRequest?.expiresAt],
  );

  const areMatchOptionsResolving =
    liveMatchQuery.isPending ||
    (liveMatchQuery.isFetching && !liveMatchQuery.data);
  const hydratedMatchOption = useMemo(() => {
    if (!hydratedQrSession || !qrSessionMatchesSelection) return null;
    if (hydratedQrSession.flow === "independent") {
      return matchOptions.find((option) => option.kind === "independent") ?? null;
    }
    return (
      matchOptions.find(
        (option) =>
          option.kind === "tournament" &&
          option.matchId === hydratedQrSession.matchId &&
          (option.tournamentId ?? "") === (hydratedQrSession.tournamentId ?? ""),
      ) ?? null
    );
  }, [hydratedQrSession, matchOptions, qrSessionMatchesSelection]);
  const tournamentScheduleMatchForScores = useMemo(() => {
    if (
      effectiveSelectedOption.kind !== "tournament" ||
      !effectiveSelectedOption.matchId
    ) {
      return null;
    }
    return (
      scheduleMatchesForPerspective.find(
        (item) => item.id === effectiveSelectedOption.matchId,
      ) ?? null
    );
  }, [
    effectiveSelectedOption.kind,
    effectiveSelectedOption.matchId,
    scheduleMatchesForPerspective,
  ]);

  const hydratedRows = useMemo(() => {
    if (!hydratedQrSession || !qrSessionMatchesSelection) return null;
    const canonicalScores = {
      playerOneScores: hydratedQrSession.playerOneScores,
      playerTwoScores: hydratedQrSession.playerTwoScores,
    };
    const displayScores =
      hydratedQrSession.flow === "tournament" &&
      tournamentScheduleMatchForScores &&
      effectiveSelectedOption.scoreRowPerspective !== "canonical"
        ? mapCanonicalScoresToViewerPerspective(
            canonicalScores,
            tournamentScheduleMatchForScores,
            userId,
          )
        : canonicalScores;
    const restoredRows = createRowsFromScorePayload(
      displayScores.playerOneScores,
      displayScores.playerTwoScores,
      hydratedMatchOption?.playMode ?? effectiveSelectedOption.playMode,
      "recordScore",
    );
    if (restoredRows.length > 0) {
      return restoredRows;
    }
    return createRowsForPlayMode(
      hydratedMatchOption?.playMode ?? effectiveSelectedOption.playMode,
    );
  }, [
    effectiveSelectedOption.playMode,
    effectiveSelectedOption.scoreRowPerspective,
    hydratedMatchOption?.playMode,
    hydratedQrSession,
    qrSessionMatchesSelection,
    tournamentScheduleMatchForScores,
    userId,
  ]);
  /** True while the active score-QR session for the selected match is loading or mismatched. */
  const isQrSessionBusy =
    mode === "generate" &&
    Boolean(activeSessionQueryInput) &&
    (activeSessionQuery.isPending ||
      (activeSessionQuery.isFetching && !qrSessionMatchesSelection) ||
      updateScoreQrMutation.isPending);
  const shouldUseHydratedState =
    mode === "generate" &&
    !generatedValidationUrl &&
    Boolean(hydratedQrSession) &&
    qrSessionMatchesSelection;

  const isConfirmDisplayReady = useMemo(() => {
    if (mode !== "confirm" || !confirmedToken) return true;
    if (validatedScoreQuery.isPending) return false;
    if (validatedScoreQuery.isFetching && !validatedRequest) return false;
    if (!validatedRequest) return false;

    if (validatedRequest.flow === "independent") {
      return true;
    }

    const matchId = resolvedConfirmMatchId;
    const tournamentId = resolvedConfirmTournamentId;
    if (!matchId) return false;

    if (tournamentId && tournamentScheduleMatchesQuery.isPending) {
      return false;
    }

    const scheduleMatch =
      tournamentScheduleMatchesQuery.data?.matches.find((item) => item.id === matchId) ??
      null;
    if (scheduleMatch) return true;

    if (liveMatchQuery.isPending) return false;
    if (inFlightMatches.some((item) => item.id === matchId)) return true;

    if (tournamentId && !tournamentScheduleMatchesQuery.isPending && !liveMatchQuery.isPending) {
      return Boolean(user && validatedRequest.requestByUserProfile);
    }

    return false;
  }, [
    confirmedToken,
    inFlightMatches,
    liveMatchQuery.isPending,
    mode,
    resolvedConfirmMatchId,
    resolvedConfirmTournamentId,
    tournamentScheduleMatchesQuery.data?.matches,
    tournamentScheduleMatchesQuery.isPending,
    user,
    validatedRequest,
    validatedScoreQuery.isFetching,
    validatedScoreQuery.isPending,
  ]);

  // Only redirect after a real confirm-context response: `data` undefined must not mean "invalid"
  // (TanStack Query v5 keeps confirm queries `pending` while disabled — avoid treating that as failure).
  const validatedScoreForbidden =
    validatedScoreQuery.isError &&
    getHttpStatus(validatedScoreQuery.error) === 403;

  const shouldRedirectInvalidConfirm = useMemo(() => {
    if (confirmSubmitFinished) return false;
    if (mode !== "confirm" || validatedScoreQuery.isPending) return false;
    if (unreadableQrRefWithoutTokenFallback) return true;
    if (!confirmedToken) return false;

    if (
      validatedScoreForbidden ||
      validatedScoreQuery.isError ||
      validatedScoreQuery.data?.valid === false ||
      (validatedScoreQuery.data?.valid === true && !validatedRequest)
    ) {
      return true;
    }

    if (!validatedRequest || validatedRequest.flow === "independent") return false;

    if (tournamentScheduleMatchesQuery.isPending || liveMatchQuery.isPending) {
      return false;
    }

    return !isConfirmDisplayReady;
  }, [
    confirmSubmitFinished,
    confirmedToken,
    isConfirmDisplayReady,
    liveMatchQuery.isPending,
    mode,
    tournamentScheduleMatchesQuery.isPending,
    unreadableQrRefWithoutTokenFallback,
    validatedRequest,
    validatedScoreForbidden,
    validatedScoreQuery.data?.valid,
    validatedScoreQuery.isError,
    validatedScoreQuery.isPending,
  ]);

  const confirmRedirectReason = useMemo<
    "wrong-user" | "invalid-link" | "load-failed" | null
  >(() => {
    if (!shouldRedirectInvalidConfirm) return null;
    if (validatedScoreQuery.isError) {
      return getHttpStatus(validatedScoreQuery.error) === 403 ? "wrong-user" : "load-failed";
    }
    if (
      validatedScoreQuery.data?.valid === false ||
      unreadableQrRefWithoutTokenFallback ||
      !validatedRequest
    ) {
      return "invalid-link";
    }
    return "load-failed";
  }, [
    shouldRedirectInvalidConfirm,
    unreadableQrRefWithoutTokenFallback,
    validatedRequest,
    validatedScoreQuery.data?.valid,
    validatedScoreQuery.error,
    validatedScoreQuery.isError,
  ]);

  const shouldShowLoadingSkeleton =
    areMatchOptionsResolving ||
    (needsScheduleForDeepLink &&
      tournamentScheduleMatchesQuery.isPending &&
      preferredGenerateOption == null) ||
    (mode === "confirm" && Boolean(confirmedToken) && !isConfirmDisplayReady);

  const generateRows = shouldUseHydratedState && hydratedRows ? hydratedRows : rows;

  // In independent confirm mode the confirmer is the "opponent" (playerTwo in the stored request).
  // Swap playerOne/playerTwo scores so the confirmer's score appears on the top row,
  // matching the swapped labels/avatars set in forcedOption.
  const isIndependentConfirmSwap =
    mode === "confirm" &&
    Boolean(validatedRequest) &&
    validatedRequest?.flow === "independent" &&
    userId !== null &&
    userId !== validatedRequest?.requestByUserId;

  const confirmDisplayScores = useMemo(() => {
    if (!validatedRequest) return null;
    const canonicalScores = {
      playerOneScores: validatedRequest.playerOneScores,
      playerTwoScores: validatedRequest.playerTwoScores,
    };
    if (isIndependentConfirmSwap) {
      return swapTournamentScorePair(canonicalScores);
    }
    if (
      validatedRequest.flow === "tournament" &&
      tournamentScheduleMatchForScores &&
      effectiveSelectedOption.scoreRowPerspective !== "canonical"
    ) {
      return mapCanonicalScoresToViewerPerspective(
        canonicalScores,
        tournamentScheduleMatchForScores,
        userId,
      );
    }
    if (
      validatedRequest.flow === "tournament" &&
      !tournamentScheduleMatchForScores &&
      userId !== null &&
      userId !== validatedRequest.requestByUserId
    ) {
      return swapTournamentScorePair(canonicalScores);
    }
    return canonicalScores;
  }, [
    effectiveSelectedOption.scoreRowPerspective,
    isIndependentConfirmSwap,
    tournamentScheduleMatchForScores,
    userId,
    validatedRequest,
  ]);

  const confirmPlayMode = validatedRequest?.playMode ?? "TieBreak10";
  const effectiveRows =
    mode !== "confirm" || !validatedRequest || !confirmDisplayScores
      ? generateRows
      : (() => {
          const fromScores = createScoreEditorRowsFromPersistedScores(
            confirmDisplayScores.playerOneScores,
            confirmDisplayScores.playerTwoScores,
            confirmPlayMode,
            "schedule",
          );
          return fromScores.length > 0
            ? fromScores
            : createRowsForPlayMode(confirmPlayMode);
        })();

  const isScoreFormValidForQr = buildScorePayload(
    effectiveRows,
    effectiveSelectedOption.playMode,
    t,
  ).ok;
  /** Only show QR while the server still has a pending session, or briefly while syncing after generate. */
  const canExposeGenerateScoreQrUi =
    mode !== "generate" ||
    isGenerating ||
    hasPendingQrSession ||
    (Boolean(generatedValidationUrl) &&
      (activeSessionQuery.isPending || activeSessionQuery.isFetching));

  const rawActiveQrDataUrl = hasPendingQrSession
    ? (hydratedQrSession?.qrDataUrl ?? generatedQrDataUrl)
    : isGenerating || activeSessionQuery.isFetching
      ? generatedQrDataUrl
      : null;
  const rawActiveValidationUrl =
    mode === "confirm"
      ? effectiveValidationUrl
      : hasPendingQrSession
        ? (hydratedQrSession?.validationUrl ?? generatedValidationUrl)
        : isGenerating || activeSessionQuery.isFetching
          ? generatedValidationUrl
          : null;
  const rawActiveExpiresAt =
    mode === "confirm"
      ? effectiveExpiresAt
      : hasPendingQrSession
        ? (hydratedQrSession?.expiresAt ?? generatedExpiresAt)
        : isGenerating || activeSessionQuery.isFetching
          ? generatedExpiresAt
          : null;
  const activeScoreQrRequestId =
    mode === "generate"
      ? (generatedRequestId ?? hydratedQrSession?.requestId)
      : null;

  const activeQrDataUrl =
    mode === "generate" && !canExposeGenerateScoreQrUi ? null : rawActiveQrDataUrl;
  const activeValidationUrl =
    mode === "generate" && !canExposeGenerateScoreQrUi ? null : rawActiveValidationUrl;
  const activeExpiresAt =
    mode === "generate" && !canExposeGenerateScoreQrUi ? null : rawActiveExpiresAt;

  const expiresAtLabel = useMemo(
    () =>
      formatExpiry(
        mode === "confirm" ? effectiveExpiresAt : activeExpiresAt,
        language,
      ),
    [activeExpiresAt, effectiveExpiresAt, language, mode],
  );

  const hasValidationLink = Boolean(activeValidationUrl);
  const currentQrRequestKey = useMemo(
    () =>
      JSON.stringify({
        kind: effectiveSelectedOption.kind,
        tournamentId: effectiveSelectedOption.tournamentId,
        matchId: effectiveSelectedOption.matchId,
        playMode: effectiveSelectedOption.playMode,
        mode: effectiveSelectedOption.mode,
        rows: effectiveRows.map((row) => [row.playerOne, row.playerTwo]),
      }),
    [effectiveRows, effectiveSelectedOption],
  );
  // Keep the ref in sync every render so async callbacks always stamp the latest key.
  currentQrRequestKeyRef.current = currentQrRequestKey;

  const isSyncingQrScores =
    mode === "generate" &&
    (updateScoreQrMutation.isPending ||
      (hasUnsavedQrChanges &&
        Boolean(activeScoreQrRequestId) &&
        isScoreFormValidForQr &&
        lastSyncedQrRequestKey !== currentQrRequestKey));
  const isScoreEntryLocked = isConfirmLocked || isSyncingQrScores;
  const isPrimaryGenerateDisabled =
    isGenerating ||
    isQrSessionBusy ||
    isSyncingQrScores ||
    Boolean(effectiveSelectedOption.hasRecordedScore);

  const onGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/record-score", { replace: true });
  };

  const onMatchChange = (nextMatchId: string) => {
    if (isConfirmLocked) return;
    const next = matchOptions.find((m) => m.id === nextMatchId);
    if (!next) return;
    if (mode === "generate" && !isScorableMatchOption(next)) return;

    setQrSessionConsumed(false);
    hadPendingQrSessionRef.current = false;
    lastTrackedQrRequestIdRef.current = null;

    const nextSearchParams = new URLSearchParams(searchParams);
    if (next.kind === "tournament" && next.matchId && next.tournamentId) {
      nextSearchParams.set("matchId", next.matchId);
      nextSearchParams.set("tournamentId", next.tournamentId);
      nextSearchParams.delete("tournamentName");
    } else {
      nextSearchParams.delete("matchId");
      nextSearchParams.delete("tournamentId");
      nextSearchParams.delete("tournamentName");
    }
    const queryString = nextSearchParams.toString();
    navigate(
      {
        search: queryString ? `?${queryString}` : "",
      },
      { replace: true },
    );

    setSelectedMatchId(nextMatchId);
    setScoreDraftRows({
      matchKey: next.id,
      rows: createRowsForPlayMode(next.playMode),
    });
    setGeneratedQrDataUrl(null);
    setGeneratedValidationUrl(null);
    setGeneratedExpiresAt(null);
    setGeneratedRequestId(null);
    setHasUnsavedQrChanges(false);
    setIsMatchPopoverOpen(false);
    setOpenScorePickerKey(null);
    setMatchSearch("");
  };

  const onScoreChange = (
    rowId: string,
    side: ScoreEditorSide,
    setIndex: number,
    value: string,
  ) => {
    if (isScoreEntryLocked) return;
    const sourceRows = shouldUseHydratedState && hydratedRows ? hydratedRows : rows;
    setScoreDraftRows({
      matchKey: scoreDraftMatchKey,
      rows: applyScoreInputChange(
        sourceRows,
        rowId,
        side,
        value,
        effectiveSelectedOption.playMode,
        setIndex,
      ),
    });
    if (mode === "generate" && hasValidationLink) {
      setHasUnsavedQrChanges(true);
    }
  };

  const onIndependentPlayModeChange = (nextPlayMode: MatchOption["playMode"]) => {
    if (isConfirmLocked) return;
    setIndependentPlayMode(nextPlayMode);
    setSelectedMatchId(INDEPENDENT_MATCH_ID);
    setScoreDraftRows({
      matchKey: INDEPENDENT_MATCH_ID,
      rows: createRowsForPlayMode(nextPlayMode),
    });
    setGeneratedQrDataUrl(null);
    setGeneratedValidationUrl(null);
    setGeneratedExpiresAt(null);
    setGeneratedRequestId(null);
    setHasUnsavedQrChanges(false);
    setOpenScorePickerKey(null);
  };

  const buildCurrentScoreInput = useCallback((showErrorToast = true): RecordTournamentMatchScoreInput | null => {
    const payload = buildScorePayload(
      effectiveRows,
      effectiveSelectedOption.playMode,
      t,
    );
    if (!payload.ok) {
      if (showErrorToast) {
        toast.error(payload.message ?? t("recordScorePage.enter.errors.invalid"));
      }
      return null;
    }

    return {
      playerOneScores: payload.playerOneScores,
      playerTwoScores: payload.playerTwoScores,
    };
  }, [effectiveRows, effectiveSelectedOption.playMode, t]);

  useEffect(() => {
    if (mode !== "generate") return;
    if (!hasUnsavedQrChanges) return;
    if (!activeScoreQrRequestId) return;
    if (!isScoreFormValidForQr) return;
    if (updateScoreQrMutation.isPending) return;
    if (lastSyncedQrRequestKey === currentQrRequestKey) return;

    const timeoutId = window.setTimeout(() => {
      const input = buildCurrentScoreInput(false);
      if (!input) return;
      const updateKey = currentQrRequestKeyRef.current;

      void updateScoreQrMutation
        .mutateAsync({
          requestId: activeScoreQrRequestId,
          playerOneScores: input.playerOneScores,
          playerTwoScores: input.playerTwoScores,
        })
        .then(() => {
          setLastSyncedQrRequestKey(updateKey);
          if (currentQrRequestKeyRef.current === updateKey) {
            setHasUnsavedQrChanges(false);
          }
        })
        .catch((error: unknown) => {
          toast.error(
            getErrorMessage(error) ??
              t("recordScorePage.enter.errors.qrGenerateFailed"),
          );
        });
    }, 150);

    return () => window.clearTimeout(timeoutId);
  }, [
    activeScoreQrRequestId,
    buildCurrentScoreInput,
    currentQrRequestKey,
    hasUnsavedQrChanges,
    isScoreFormValidForQr,
    lastSyncedQrRequestKey,
    mode,
    t,
    updateScoreQrMutation,
  ]);

  const onGenerateQr = useCallback(
    async (options?: { showSuccessToast?: boolean; forceGenerateNew?: boolean }) => {
      if (effectiveSelectedOption.hasRecordedScore) {
        toast.error(
          t(
            "recordScorePage.enter.errors.matchAlreadyScored",
            "This match already has a recorded score.",
          ),
        );
        return null;
      }
      if (!canGenerateQr) {
        toast.error(t("recordScorePage.enter.errors.noTournamentMatchSelected"));
        return null;
      }

      const input = buildCurrentScoreInput(options?.showSuccessToast !== false);
      if (!input) return null;

      // If a session is already active and the user only changed scores, update the
      // existing request in-place (same token/QR) instead of regenerating.
      if (
        !options?.forceGenerateNew &&
        hasUnsavedQrChanges &&
        activeScoreQrRequestId
      ) {
        let patchOk = false;
        try {
          await updateScoreQrMutation.mutateAsync({
            requestId: activeScoreQrRequestId,
            playerOneScores: input.playerOneScores,
            playerTwoScores: input.playerTwoScores,
          });
          patchOk = true;
          setHasUnsavedQrChanges(false);
          setLastSyncedQrRequestKey(currentQrRequestKeyRef.current);
          if (options?.showSuccessToast !== false) {
            toast.success(t("recordScorePage.enter.qrScoresUpdated", { defaultValue: "Scores updated" }));
          }
        } catch (error: unknown) {
          const status = getHttpStatus(error);
          if (status === 404 || status === 410) {
            // Session expired or already consumed — fall through to full regeneration below.
            setGeneratedQrDataUrl(null);
            setGeneratedValidationUrl(null);
            setGeneratedExpiresAt(null);
            setGeneratedRequestId(null);
          } else {
            toast.error(
              getErrorMessage(error) ?? t("recordScorePage.enter.errors.qrGenerateFailed"),
            );
            return null;
          }
        }
        if (patchOk) {
          return activeValidationUrl;
        }
      }

      try {
        const result =
          effectiveSelectedOption.kind === "tournament" &&
          effectiveSelectedOption.tournamentId &&
          effectiveSelectedOption.matchId
            ? await generateTournamentQrMutation.mutateAsync({
                tournamentId: effectiveSelectedOption.tournamentId,
                matchId: effectiveSelectedOption.matchId,
                input,
              })
            : await generateIndependentQrMutation.mutateAsync({
                ...input,
                independentMatchType: effectiveSelectedOption.mode,
                independentPlayMode: effectiveSelectedOption.playMode,
              });

        setGeneratedQrDataUrl(result.qr.dataUrl);
        setGeneratedValidationUrl(result.qr.validationUrl);
        setGeneratedExpiresAt(result.qr.expiresAt);
        setGeneratedRequestId(result.qr.requestId);
        setHasUnsavedQrChanges(false);
        setLastSyncedQrRequestKey(currentQrRequestKeyRef.current);
        // Use the ref (not the closed-over value) so we always stamp the key that is
        // current at the time the response lands, even if external data (liveMatch
        // refetch) shifted the selection while the request was in flight.
        lastAutoGeneratedQrKeyRef.current = currentQrRequestKeyRef.current;
        if (options?.showSuccessToast !== false) {
          toast.success(t("recordScorePage.enter.qrGenerated"));
        }
        return result.qr.validationUrl;
      } catch (error: unknown) {
        const message = getErrorMessage(error) ?? "";
        const isCompletedMatchQrError =
          message.includes("completed/cancelled") ||
          message.includes("already has a recorded score");
        if (qrSessionConsumed || isCompletedMatchQrError) {
          return null;
        }
        toast.error(message || t("recordScorePage.enter.errors.qrGenerateFailed"));
        return null;
      }
    },
    [
      activeScoreQrRequestId,
      activeValidationUrl,
      buildCurrentScoreInput,
      canGenerateQr,
      currentQrRequestKey,
      effectiveSelectedOption.hasRecordedScore,
      effectiveSelectedOption.kind,
      effectiveSelectedOption.matchId,
      effectiveSelectedOption.mode,
      effectiveSelectedOption.playMode,
      effectiveSelectedOption.tournamentId,
      generateIndependentQrMutation,
      generateTournamentQrMutation,
      hasUnsavedQrChanges,
      qrSessionConsumed,
      t,
      updateScoreQrMutation,
    ],
  );

  const cancelActiveQrMutation = useCancelActiveScoreQr();

  /**
   * Explicitly start a brand-new independent match.
   * Clears all generated/hydrated state so the auto-generate effect fires fresh.
   * This replaces the old auto-reset that wiped state whenever the session disappeared.
   */
  const onNewIndependentMatch = useCallback(() => {
    setGeneratedQrDataUrl(null);
    setGeneratedValidationUrl(null);
    setGeneratedExpiresAt(null);
    setGeneratedRequestId(null);
    setHasUnsavedQrChanges(false);
    setScoreDraftRows(null);
    // Reset the auto-generate guard refs so the effect fires for the new match.
    lastAutoGeneratedQrKeyRef.current = null;
    attemptedAutoQrKeyRef.current = null;

    if (effectiveSelectedOption.kind === "independent") {
      void cancelActiveQrMutation.mutateAsync();
    }
  }, [cancelActiveQrMutation, effectiveSelectedOption.kind]);

  const shareOrCopyValidationUrl = async (url: string) => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share(
          shareDataWithUrlInText({
            textBeforeUrl: t("recordScorePage.enter.validationLinkShareText"),
            url,
          }),
        );
        return;
      } catch (error: unknown) {
        const name = error instanceof Error ? error.name : "";
        if (name === "AbortError") {
          return;
        }
        try {
          await navigator.clipboard.writeText(url);
          toast.success(
            t("recordScorePage.enter.validationLinkCopiedFallback"),
          );
        } catch {
          toast.error(t("recordScorePage.enter.validationLinkShareFailed"));
        }
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("recordScorePage.enter.validationLinkCopied"));
    } catch {
      toast.error(t("recordScorePage.enter.validationLinkCopyFailed"));
    }
  };

  const onGenerateOrOpenValidationLink = async () => {
    if (mode !== "generate") return;

    // If scores are dirty but we have a live independent session, PATCH the scores
    // first, then share the same URL (the token hasn't changed).
    if (
      hasUnsavedQrChanges &&
      hydratedQrSession?.flow === "independent" &&
      activeValidationUrl
    ) {
      const validationUrl = await onGenerateQr({ showSuccessToast: false });
      if (validationUrl) {
        await shareOrCopyValidationUrl(validationUrl);
      }
      return;
    }

    if (hasValidationLink && activeValidationUrl && !hasUnsavedQrChanges) {
      await shareOrCopyValidationUrl(activeValidationUrl);
      return;
    }

    await onGenerateQr();
  };

  const clearGenerateQrState = useCallback(
    (options?: { preserveAutoGenerateGuards?: boolean }) => {
      setGeneratedQrDataUrl(null);
      setGeneratedValidationUrl(null);
      setGeneratedExpiresAt(null);
      setGeneratedRequestId(null);
      setHasUnsavedQrChanges(false);
      setLastSyncedQrRequestKey(null);
      if (!options?.preserveAutoGenerateGuards) {
        lastAutoGeneratedQrKeyRef.current = null;
        attemptedAutoQrKeyRef.current = null;
      }
    },
    [],
  );

  const refreshMatchDataAfterQrConsumed = useCallback(async () => {
    const tournamentId = effectiveSelectedOption.tournamentId;
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKeys.tournament.liveMatch(),
        refetchType: "all",
      }),
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.tournament.all, "score-qr", "active"],
        refetchType: "all",
      }),
      tournamentId
        ? queryClient.invalidateQueries({
            queryKey: queryKeys.tournament.matches(tournamentId),
            refetchType: "all",
          })
        : Promise.resolve(),
      tournamentId
        ? queryClient.invalidateQueries({
            queryKey: queryKeys.tournament.detail(tournamentId),
            refetchType: "all",
          })
        : Promise.resolve(),
    ]);
  }, [effectiveSelectedOption.tournamentId, queryClient]);

  useEffect(() => {
    if (mode !== "generate") {
      hadPendingQrSessionRef.current = false;
      lastTrackedQrRequestIdRef.current = null;
      return;
    }

    if (!activeSessionQueryInput) {
      return;
    }

    const activeSessionSettled =
      !activeSessionQuery.isPending && !activeSessionQuery.isFetching;
    const sessionAbsent =
      activeSessionQuery.isSuccess && (activeSessionQuery.data?.session ?? null) === null;
    const wasTrackingSession = Boolean(lastTrackedQrRequestIdRef.current);

    const opponentConfirmedSession =
      wasTrackingSession &&
      !hasPendingQrSession &&
      activeSessionSettled &&
      sessionAbsent &&
      !isSyncingQrScores &&
      !isGenerating;

    if (opponentConfirmedSession) {
      setQrSessionConsumed(true);
      const consumedMatchKey = currentQrRequestKeyRef.current;
      lastAutoGeneratedQrKeyRef.current = consumedMatchKey;
      attemptedAutoQrKeyRef.current = consumedMatchKey;

      const consumedMatchId =
        effectiveSelectedOption.kind === "tournament"
          ? effectiveSelectedOption.matchId
          : null;
      if (consumedMatchId) {
        setExcludedEnterScoreMatchIds((previous) => {
          const next = new Set(previous);
          next.add(consumedMatchId);
          return next;
        });
      }

      clearGenerateQrState({ preserveAutoGenerateGuards: true });
      setScoreDraftRows(null);

      void refreshMatchDataAfterQrConsumed().then(() => {
        toast.success(
          t("recordScorePage.enter.opponentConfirmedScore", {
            defaultValue:
              "Your opponent confirmed the score. You can record a new match or pick another match.",
          }),
        );
      });
    }

    if (hasPendingQrSession && hydratedQrSession?.requestId) {
      hadPendingQrSessionRef.current = true;
      lastTrackedQrRequestIdRef.current = hydratedQrSession.requestId;
    } else if (activeSessionSettled && sessionAbsent && !isSyncingQrScores && !isGenerating) {
      hadPendingQrSessionRef.current = false;
      lastTrackedQrRequestIdRef.current = null;
    }
  }, [
    activeSessionQuery.data,
    activeSessionQuery.isFetching,
    activeSessionQuery.isPending,
    activeSessionQuery.isSuccess,
    activeSessionQueryInput,
    clearGenerateQrState,
    hasPendingQrSession,
    hydratedQrSession?.requestId,
    isGenerating,
    isSyncingQrScores,
    mode,
    effectiveSelectedOption.kind,
    effectiveSelectedOption.matchId,
    refreshMatchDataAfterQrConsumed,
    t,
  ]);

  // Keep URL and selection off completed matches (e.g. deep link after score was recorded).
  // Runs after QR-consumed handling so requesters do not get a duplicate "already scored" toast
  // when the opponent confirms via QR.
  const scoredMatchRedirect = useMemo(() => {
    if (mode !== "generate" || shouldShowLoadingSkeleton) return null;

    const scoredPrefill = Boolean(
      forcedMatchId && preferredGenerateOption?.hasRecordedScore,
    );
    const scoredSelection = Boolean(
      selectedMatchId &&
        matchOptions.find((option) => option.id === selectedMatchId)?.hasRecordedScore,
    );

    if (!scoredPrefill && !scoredSelection) return null;

    const target =
      pickDefaultScorableTournamentOption(tournamentMatchOptions) ?? independentOption;

    if (qrSessionConsumed) {
      if (isScorableMatchOption(target) && target.id !== resolvedSelectedMatchId) {
        return { kind: "switch" as const, matchId: target.id, notify: false };
      }
      return { kind: "noop" as const };
    }

    if (!isScorableMatchOption(target)) {
      return { kind: "exit" as const };
    }

    if (target.id === resolvedSelectedMatchId) return null;

    return { kind: "switch" as const, matchId: target.id, notify: true };
  }, [
    forcedMatchId,
    independentOption,
    matchOptions,
    mode,
    preferredGenerateOption?.hasRecordedScore,
    qrSessionConsumed,
    resolvedSelectedMatchId,
    selectedMatchId,
    shouldShowLoadingSkeleton,
    tournamentMatchOptions,
  ]);

  useEffect(() => {
    if (!scoredMatchRedirect) return;
    if (skippedScoredMatchRef.current) return;
    skippedScoredMatchRef.current = true;

    if (scoredMatchRedirect.kind === "switch") {
      onMatchChange(scoredMatchRedirect.matchId);
      if (scoredMatchRedirect.notify) {
        toast.info(
          t(
            "recordScorePage.enter.matchAlreadyScoredSwitch",
            "That match is already scored. Switched to your next available match.",
          ),
        );
      }
      return;
    }

    if (scoredMatchRedirect.kind === "exit") {
      navigate("/record-score", { replace: true });
      toast.error(
        t(
          "recordScorePage.enter.errors.matchAlreadyScored",
          "This match already has a recorded score.",
        ),
      );
    }
  }, [navigate, onMatchChange, scoredMatchRedirect, t]);

  useEffect(() => {
    if (mode !== "generate") return;
    if (excludedEnterScoreMatchIds.size === 0) return;

    const staleIds = [...excludedEnterScoreMatchIds].filter((matchId) => {
      const live = inFlightMatches.find((item) => item.id === matchId);
      return !live || liveMatchHasRecordedScore(live);
    });
    if (staleIds.length === 0) return;

    setExcludedEnterScoreMatchIds((previous) => {
      const next = new Set(previous);
      for (const matchId of staleIds) {
        next.delete(matchId);
      }
      return next.size === previous.size ? previous : next;
    });
  }, [excludedEnterScoreMatchIds, inFlightMatches, mode]);

  useEffect(() => {
    if (mode !== "generate") return;
    const selectedMatchIdValue =
      effectiveSelectedOption.kind === "tournament"
        ? effectiveSelectedOption.matchId
        : null;
    if (!selectedMatchIdValue) return;
    if (!excludedEnterScoreMatchIds.has(selectedMatchIdValue)) return;

    const target =
      pickDefaultScorableTournamentOption(tournamentMatchOptions) ?? independentOption;
    if (target.id === resolvedSelectedMatchId) return;
    if (skippedScoredMatchRef.current) return;

    skippedScoredMatchRef.current = true;
    onMatchChange(target.id);
  }, [
    effectiveSelectedOption.kind,
    effectiveSelectedOption.matchId,
    excludedEnterScoreMatchIds,
    independentOption,
    mode,
    onMatchChange,
    resolvedSelectedMatchId,
    tournamentMatchOptions,
  ]);

  useEffect(() => {
    if (mode !== "generate") return;
    if (qrSessionConsumed) return;
    if (isSyncingQrScores || hasUnsavedQrChanges) return;
    if (!effectiveSelectedOption.hasRecordedScore) return;
    if (!hasPendingQrSession && !generatedValidationUrl && !generatedQrDataUrl) {
      return;
    }
    clearGenerateQrState();
    void refreshMatchDataAfterQrConsumed();
  }, [
    clearGenerateQrState,
    effectiveSelectedOption.hasRecordedScore,
    generatedQrDataUrl,
    generatedValidationUrl,
    hasPendingQrSession,
    hasUnsavedQrChanges,
    isSyncingQrScores,
    mode,
    qrSessionConsumed,
    refreshMatchDataAfterQrConsumed,
  ]);

  useEffect(() => {
    attemptedAutoQrKeyRef.current = null;
  }, [currentQrRequestKey]);

  useEffect(() => {
    if (mode !== "generate") return;
    if (isScoreFormValidForQr) return;
    setGeneratedQrDataUrl(null);
    setGeneratedValidationUrl(null);
    setGeneratedExpiresAt(null);
    setGeneratedRequestId(null);
    lastAutoGeneratedQrKeyRef.current = null;
    attemptedAutoQrKeyRef.current = null;
    setLastSyncedQrRequestKey(null);
  }, [isScoreFormValidForQr, mode]);

  useEffect(() => {
    if (mode !== "generate") return;
    if (qrSessionConsumed) return;
    if (!canGenerateQr || isGenerating || isQrSessionBusy || !isScoreFormValidForQr) return;

    // ─── Guard 1: wait until the active-session query has settled ────────────────
    // Without this, the effect fires on mount (generatedValidationUrl is null after
    // a refresh), calls generateIndependentScoreQr, which calls cancelPendingRequests
    // and creates a NEW token — silently invalidating B's already-open link.
    if (activeSessionQuery.isPending) return;

    // ─── Guard 2: don't generate if a live session already exists ────────────────
    // The hydrated session will be displayed without creating a new request.
    // This also prevents re-generating when the user only changed scores
    // (the update path in onGenerateQr handles that case via PATCH).
    if (hydratedQrSession && qrSessionMatchesSelection) return;

    // If we already hold a valid link and the user hasn't made unsaved score changes,
    // do NOT auto-regenerate. A key shift here means external data (e.g. a liveMatch
    // refetch repositioning the effective selection) changed the key after the last
    // successful generate — that should not loop the UI back into "Generating QR".
    // The user must explicitly change scores or the match to trigger a new generate.
    if (generatedValidationUrl && !hasUnsavedQrChanges) return;
    if (lastAutoGeneratedQrKeyRef.current === currentQrRequestKey) return;
    if (attemptedAutoQrKeyRef.current === currentQrRequestKey) return;

    const timeoutId = window.setTimeout(() => {
      attemptedAutoQrKeyRef.current = currentQrRequestKey;
      void onGenerateQr({ showSuccessToast: false });
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [
    activeSessionQuery.isPending,
    canGenerateQr,
    currentQrRequestKey,
    effectiveRows,
    effectiveSelectedOption.kind,
    effectiveSelectedOption.matchId,
    effectiveSelectedOption.mode,
    effectiveSelectedOption.playMode,
    effectiveSelectedOption.tournamentId,
    generatedValidationUrl,
    hasUnsavedQrChanges,
    hydratedQrSession,
    isGenerating,
    isQrSessionBusy,
    isScoreFormValidForQr,
    mode,
    onGenerateQr,
    qrSessionMatchesSelection,
  ]);

  const onSubmitConfirmedScore = async () => {
    if (!canSubmitConfirmedScore) {
      toast.error(t("recordScorePage.enter.errors.noTournamentMatchSelected"));
      return;
    }

    unlockScoreQrScanSound();
    playScoreQrScanSound();

    setConfirmSubmitFinished(true);

    try {
      const response = await confirmScoreQrMutation.mutateAsync({
        token: confirmedToken,
      });
      clearScoreQrToken(confirmedTokenRef);
      toast.success(
        t("recordScorePage.validate.success", {
          defaultValue: "Score confirmed successfully.",
        }),
      );
      window.setTimeout(() => {
        navigate("/record-score", { replace: true });
      }, 0);
      void invalidateQueriesAfterTournamentScoreConfirm(
        queryClient,
        response.match.tournamentId,
      );
    } catch (error: unknown) {
      setConfirmSubmitFinished(false);
      if (getHttpStatus(error) === 403) {
        toast.error(
          t(
            "recordScorePage.enter.errors.confirmNotAllowed",
            "You are not allowed to confirm this score.",
          ),
        );
        return;
      }
      toast.error(
        getErrorMessage(error) ??
          t("recordScorePage.validate.errors.confirmFailed"),
      );
    }
  };

  const hasActiveIndependentSession =
    mode === "generate" &&
    effectiveSelectedOption.kind === "independent" &&
    Boolean(hydratedQrSession ?? generatedValidationUrl);

  return {
    mode,
    isMatchPopoverOpen,
    setIsMatchPopoverOpen,
    openScorePickerKey,
    setOpenScorePickerKey,
    matchSearch,
    setMatchSearch,
    filteredMatchOptions,
    effectiveSelectedOption: enrichedSelectedOption,
    isConfirmLocked,
    isValidatedContextOk,
    shouldRedirectInvalidConfirm,
    confirmRedirectReason,
    onGoBack,
    onMatchChange,
    onIndependentPlayModeChange,
    onNewIndependentMatch,
    effectiveRows,
    onScoreChange,
    expiresAtLabel,
    hasUnsavedQrChanges,
    activeQrDataUrl,
    shouldShowLoadingSkeleton,
    isConfirmSubmitting: confirmScoreQrMutation.isPending,
    canSubmitConfirmedScore,
    onSubmitConfirmedScore,
    onGenerateOrOpenValidationLink,
    isPrimaryGenerateDisabled,
    isGenerating,
    isSyncingQrScores,
    isScoreEntryLocked,
    hasValidationLink,
    hasActiveIndependentSession,
  };
}
