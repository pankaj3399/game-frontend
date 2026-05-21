import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { TFunction } from "i18next";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { getErrorMessage, getHttpStatus } from "@/lib/errors";
import {
  playScoreQrScanSound,
  preloadScoreQrScanSound,
  unlockScoreQrScanSound,
} from "@/lib/scoreQrScanSound";
import { shareDataWithUrlInText } from "@/lib/webShare";
import { useTournamentLiveMatch } from "@/pages/tournaments/hooks/useTournamentLiveMatch";
import { useTournamentMatches } from "@/pages/tournaments/hooks/useTournamentMatches";
import {
  useActiveTournamentScoreQrSession,
  useConfirmTournamentScoreQr,
  useGenerateIndependentScoreQr,
  useGenerateTournamentScoreQr,
  useUpdateScoreQrScores,
  useValidateTournamentScoreQrConfirmContext,
  useCancelActiveScoreQr,
} from "@/pages/tournaments/hooks/useTournamentScoreQr";
import {
  applyScoreInputChange,
  buildScorePayload,
  hasRecordedMatchScore,
  type ScoreEditorRow,
  type ScoreEditorSide,
} from "@/pages/tournaments/schedule/utils/matchScheduleScore";
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
  createRowsForPlayMode,
  formatExpiry,
  formatLiveMatchTeamLabel,
  isPendingTournamentOptionId,
  isScorableMatchOption,
  normalizeDisplayName,
  normalizeDisplayNameForLabel,
  pendingTournamentOptionId,
  pickDefaultEligibleTournamentOption,
  pickDefaultScorableTournamentOption,
  playerDisplayName,
  scoreValueToInput,
} from "../helpers";
import { INDEPENDENT_MATCH_ID, type MatchOption } from "../types";
import {
  buildConfirmScoreQrLocationAfterTokenPromotion,
  clearScoreQrToken,
  pruneScoreQrToken,
  readScoreQrToken,
} from "../../scoreQrTokenSession";

function createRowsFromScorePayload(
  playerOneScores: Array<number | "wo">,
  playerTwoScores: Array<number | "wo">,
): ScoreEditorRow[] {
  const maxRows = Math.max(playerOneScores.length, playerTwoScores.length);
  if (maxRows === 0) return [];

  return Array.from({ length: maxRows }, (_, index) => ({
    id: `set-${index + 1}`,
    playerOne:
      index < playerOneScores.length ? scoreValueToInput(playerOneScores[index]) : "",
    playerTwo:
      index < playerTwoScores.length ? scoreValueToInput(playerTwoScores[index]) : "",
    lastEditedSide: null,
  }));
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

  const liveMatchQuery = useTournamentLiveMatch(true);
  const forcedTournamentMatchesQuery = useTournamentMatches(
    preferredGenerateTournamentId || null,
    hasManualPrefill,
  );
  const validatedScoreQuery = useValidateTournamentScoreQrConfirmContext(
    confirmedToken,
    mode === "confirm" && Boolean(confirmedToken),
  );

  useEffect(() => {
    if (mode !== "confirm") return;
    preloadScoreQrScanSound();
  }, [mode]);
  const generateTournamentQrMutation = useGenerateTournamentScoreQr();
  const generateIndependentQrMutation = useGenerateIndependentScoreQr();
  const updateScoreQrMutation = useUpdateScoreQrScores();
  const confirmScoreQrMutation = useConfirmTournamentScoreQr();
  const validatedRequest = validatedScoreQuery.data?.request ?? null;

  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const [isMatchPopoverOpen, setIsMatchPopoverOpen] = useState(false);
  const [openScorePickerKey, setOpenScorePickerKey] = useState<string | null>(null);
  const [matchSearch, setMatchSearch] = useState("");
  const [generatedQrDataUrl, setGeneratedQrDataUrl] = useState<string | null>(null);
  const [generatedValidationUrl, setGeneratedValidationUrl] = useState<string | null>(null);
  const [generatedExpiresAt, setGeneratedExpiresAt] = useState<string | null>(null);
  const [hasUnsavedQrChanges, setHasUnsavedQrChanges] = useState(false);
  const [independentPlayMode, setIndependentPlayMode] =
    useState<MatchOption["playMode"]>("TieBreak10");
  const lastAutoGeneratedQrKeyRef = useRef<string | null>(null);
  /** Prevents the auto-generate effect from scheduling duplicate attempts for the same request key after a failed mutation. */
  const attemptedAutoQrKeyRef = useRef<string | null>(null);
  const skippedScoredMatchRef = useRef(false);
  const resolvedPendingTournamentRef = useRef<string | null>(null);
  /** Keeps the last non-empty tournament title per match across live-match refetches (API can briefly omit names). */
  const lastNonEmptyTournamentNameByMatchIdRef = useRef(new Map<string, string>());
  /**
   * Always holds the latest currentQrRequestKey so async callbacks (onGenerateQr) can
   * write the correct key into lastAutoGeneratedQrKeyRef even when the value changed
   * during the network round-trip (e.g. due to a liveMatch refetch shifting the selection).
   */
  const currentQrRequestKeyRef = useRef<string>("");

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
    return inFlightMatches
      .filter((match) => match.tournament.id != null)
      .filter((match) => {
        if (!userId) return true;
        return (
          match.myTeam.some((player) => player.id === userId) ||
          match.opponentTeam.some((player) => player.id === userId)
        );
      })
      .map((match) => ({
        id: match.id,
        label: buildMatchLabel(t, mergeStableTournamentNameForLabel(match)),
        startTime: match.startTime,
        playMode: match.playMode ?? "TieBreak10",
        mode: match.mode,
        kind: "tournament" as const,
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
        hasRecordedScore: match.status === "completed",
      }))
      .sort((a, b) => {
        if (a.isLive && !b.isLive) return -1;
        if (!a.isLive && b.isLive) return 1;
        if (a.isPendingScore && !b.isPendingScore) return -1;
        if (!a.isPendingScore && b.isPendingScore) return 1;
        return a.label.localeCompare(b.label);
      });
  }, [inFlightMatches, liveMatch?.id, mergeStableTournamentNameForLabel, t, userId]);

  const eligibleTournamentMatchOptions = useMemo<MatchOption[]>(() => {
    return eligibleTournaments.map((tournament) => {
      const tournamentName =
        normalizeDisplayNameForLabel(tournament.name, 40) ||
        t("recordScorePage.enter.validatedMatchFallback", {
          defaultValue: "Selected tournament",
        });
      const awaitingLabel = t("recordScorePage.enter.awaitingMatch", {
        defaultValue: "Awaiting match",
      });

      return {
        id: pendingTournamentOptionId(tournament.id),
        label: `${tournamentName} · ${awaitingLabel}`,
        startTime: tournament.date,
        playMode: tournament.playMode,
        mode: "singles",
        kind: "tournament",
        tournamentId: tournament.id,
        matchId: null,
        round: null,
        playerOneRowLabel: user
          ? playerDisplayName(user, t("recordScorePage.enter.myScore"), false)
          : t("recordScorePage.enter.myScore"),
        playerTwoRowLabel: t("recordScorePage.enter.opponentScore"),
        playerOneAvatarUrl: user?.profilePictureUrl ?? null,
        playerTwoAvatarUrl: null,
        isLive: false,
        isPendingScore: false,
        hasRecordedScore: false,
      };
    });
  }, [eligibleTournaments, t, user]);

  const forcedScheduleMatchOption = useMemo<MatchOption | null>(() => {
    if (!hasManualPrefill || !preferredGenerateMatchId || !preferredGenerateTournamentId) {
      return null;
    }

    const match =
      forcedTournamentMatchesQuery.data?.matches.find(
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
    };
  }, [
    forcedTournamentMatchesQuery.data?.matches,
    hasManualPrefill,
    manualPrefillTournamentName,
    preferredGenerateMatchId,
    preferredGenerateTournamentId,
    t,
    userId,
  ]);

  const matchOptions = useMemo(
    () => {
      const existingForcedOption = forcedScheduleMatchOption
        ? tournamentMatchOptions.some(
            (option) =>
              option.kind === "tournament" &&
              option.matchId === forcedScheduleMatchOption.matchId &&
              (option.tournamentId ?? "") ===
                (forcedScheduleMatchOption.tournamentId ?? ""),
          )
        : false;
      return [
        ...(forcedScheduleMatchOption &&
        !existingForcedOption &&
        !forcedScheduleMatchOption.hasRecordedScore
          ? [forcedScheduleMatchOption]
          : []),
        ...tournamentMatchOptions,
        ...eligibleTournamentMatchOptions,
        independentOption,
      ];
    },
    [
      eligibleTournamentMatchOptions,
      forcedScheduleMatchOption,
      independentOption,
      tournamentMatchOptions,
    ],
  );

  const forcedOption = useMemo(() => {
    if (mode !== "confirm") return null;
    if (!resolvedConfirmMatchId) return null;

    const existingOption =
      matchOptions.find(
        (option) =>
          option.matchId === resolvedConfirmMatchId &&
          (option.tournamentId ?? "") === (resolvedConfirmTournamentId ?? ""),
      ) ?? null;
    if (existingOption) return existingOption;
    if (!validatedRequest) return null;

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
      } satisfies MatchOption;
    }

    return {
      id: resolvedConfirmMatchId,
      label:
        matchedLiveItem != null
          ? buildMatchLabel(t, mergeStableTournamentNameForLabel(matchedLiveItem))
          : t("recordScorePage.enter.validatedMatchFallback", {
              defaultValue: "Validated match",
            }),
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
          : t("recordScorePage.enter.myScore"),
      playerTwoRowLabel:
        matchedLiveItem != null
          ? formatLiveMatchTeamLabel(matchedLiveItem.opponentTeam, t)
          : t("recordScorePage.enter.opponentScore"),
      playerOneAvatarUrl: matchedLiveItem?.myTeam[0]?.profilePictureUrl ?? null,
      playerTwoAvatarUrl: matchedLiveItem?.opponentTeam[0]?.profilePictureUrl ?? null,
      isLive: false,
      isPendingScore: true,
    } satisfies MatchOption;
  }, [
    inFlightMatches,
    matchOptions,
    mergeStableTournamentNameForLabel,
    mode,
    resolvedConfirmMatchId,
    resolvedConfirmTournamentId,
    t,
    user,
    userId,
    validatedRequest,
  ]);

  const defaultOption = useMemo(() => {
    return (
      forcedOption ??
      pickDefaultScorableTournamentOption(tournamentMatchOptions) ??
      pickDefaultEligibleTournamentOption(eligibleTournamentMatchOptions) ??
      independentOption
    );
  }, [
    eligibleTournamentMatchOptions,
    forcedOption,
    independentOption,
    tournamentMatchOptions,
  ]);

  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const preferredGenerateOption = useMemo(() => {
    if (!preferredGenerateMatchId) return null;

    const matchesPrefill = (option: MatchOption) =>
      option.kind === "tournament" &&
      option.matchId === preferredGenerateMatchId &&
      (!preferredGenerateTournamentId ||
        (option.tournamentId ?? "") === preferredGenerateTournamentId);

    const fromList = matchOptions.find(matchesPrefill) ?? null;
    if (fromList) return fromList;

    if (
      forcedScheduleMatchOption &&
      forcedScheduleMatchOption.matchId === preferredGenerateMatchId &&
      (!preferredGenerateTournamentId ||
        (forcedScheduleMatchOption.tournamentId ?? "") ===
          preferredGenerateTournamentId)
    ) {
      return forcedScheduleMatchOption;
    }

    return null;
  }, [
    forcedScheduleMatchOption,
    matchOptions,
    preferredGenerateMatchId,
    preferredGenerateTournamentId,
  ]);
  const manualPrefillSummaryLabel = useMemo(() => {
    if (!hasManualPrefill) return "";
    if (preferredGenerateOption?.kind === "tournament") {
      return "";
    }
    if (manualPrefillTournamentName) {
      return t("recordScorePage.enter.prefilledScheduleLoading", {
        tournament: manualPrefillTournamentName,
      });
    }
    return t("recordScorePage.enter.prefilledScheduleLoadingShort");
  }, [
    hasManualPrefill,
    manualPrefillTournamentName,
    preferredGenerateOption,
    t,
  ]);
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
    if (effectiveSelectedOption.hasRecordedScore) return undefined;
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

  const activeSessionQuery = useActiveTournamentScoreQrSession(
    activeSessionQueryInput,
    mode === "generate" && Boolean(activeSessionQueryInput),
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

  // Only redirect after a real confirm-context response: `data` undefined must not mean "invalid"
  // (TanStack Query v5 keeps confirm queries `pending` while disabled — avoid treating that as failure).
  const validatedScoreForbidden =
    validatedScoreQuery.isError &&
    getHttpStatus(validatedScoreQuery.error) === 403;

  const shouldRedirectInvalidConfirm =
    mode === "confirm" &&
    !validatedScoreQuery.isPending &&
    (unreadableQrRefWithoutTokenFallback ||
      (Boolean(confirmedToken) &&
        (validatedScoreForbidden ||
          validatedScoreQuery.data?.valid === false ||
          (validatedScoreQuery.data?.valid === true && !validatedRequest))));

  const confirmRedirectReason = useMemo<
    "wrong-user" | "invalid-link" | null
  >(() => {
    if (!shouldRedirectInvalidConfirm) return null;
    if (validatedScoreQuery.isError && getHttpStatus(validatedScoreQuery.error) === 403) {
      return "wrong-user";
    }
    return "invalid-link";
  }, [
    shouldRedirectInvalidConfirm,
    validatedScoreQuery.error,
    validatedScoreQuery.isError,
  ]);

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
  const hydratedRows = useMemo(() => {
    if (!hydratedQrSession || !qrSessionMatchesSelection) return null;
    const restoredRows = createRowsFromScorePayload(
      hydratedQrSession.playerOneScores,
      hydratedQrSession.playerTwoScores,
    );
    if (restoredRows.length > 0) {
      return restoredRows;
    }
    return createRowsForPlayMode(
      hydratedMatchOption?.playMode ?? effectiveSelectedOption.playMode,
    );
  }, [
    effectiveSelectedOption.playMode,
    hydratedMatchOption?.playMode,
    hydratedQrSession,
    qrSessionMatchesSelection,
  ]);
  /** True while the active score-QR session for the selected match is loading or mismatched. */
  const isQrSessionBusy =
    mode === "generate" &&
    Boolean(activeSessionQueryInput) &&
    (activeSessionQuery.isPending ||
      (activeSessionQuery.isFetching && !qrSessionMatchesSelection));
  const shouldUseHydratedState =
    mode === "generate" &&
    !generatedValidationUrl &&
    Boolean(hydratedQrSession) &&
    qrSessionMatchesSelection;

  const shouldShowLoadingSkeleton =
    areMatchOptionsResolving ||
    (hasManualPrefill &&
      forcedTournamentMatchesQuery.isPending &&
      preferredGenerateOption == null) ||
    (mode === "confirm" && Boolean(confirmedToken) && validatedScoreQuery.isPending);

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

  const effectiveRows =
    mode !== "confirm" || !validatedRequest
      ? generateRows
      : Array.from(
          {
            length: Math.max(
              createRowsForPlayMode(validatedRequest.playMode ?? "TieBreak10").length,
              validatedRequest.playerOneScores.length,
              validatedRequest.playerTwoScores.length,
            ),
          },
          (_, index) => {
            const p1Scores = isIndependentConfirmSwap
              ? validatedRequest.playerTwoScores
              : validatedRequest.playerOneScores;
            const p2Scores = isIndependentConfirmSwap
              ? validatedRequest.playerOneScores
              : validatedRequest.playerTwoScores;
            return {
              id: `set-${index + 1}`,
              playerOne: index < p1Scores.length ? scoreValueToInput(p1Scores[index]) : "",
              playerTwo: index < p2Scores.length ? scoreValueToInput(p2Scores[index]) : "",
              lastEditedSide: null,
            };
          },
        );

  const isScoreFormValidForQr = buildScorePayload(
    effectiveRows,
    effectiveSelectedOption.playMode,
    t,
  ).ok;
  /** In generate mode, do not surface hydrated/generated QR or URLs unless the grid matches a complete valid score (same rule as generate API) and there are no local edits pending regen. */
  // A hydrated active session is always safe to expose (the token is still live on B's side);
  // only hide the QR when scores are invalid or changes are unsaved WITHOUT an active session.
  const canExposeGenerateScoreQrUi =
    mode !== "generate" ||
    shouldUseHydratedState ||
    Boolean(generatedValidationUrl) ||
    (isScoreFormValidForQr && !hasUnsavedQrChanges);

  const rawActiveQrDataUrl =
    generatedQrDataUrl ??
    (shouldUseHydratedState ? hydratedQrSession?.qrDataUrl ?? null : null);
  const rawActiveValidationUrl =
    mode === "confirm"
      ? effectiveValidationUrl
      : generatedValidationUrl ??
        (shouldUseHydratedState ? hydratedQrSession?.validationUrl ?? null : null);
  const rawActiveExpiresAt =
    mode === "confirm"
      ? effectiveExpiresAt
      : generatedExpiresAt ??
        (shouldUseHydratedState ? hydratedQrSession?.expiresAt ?? null : null);

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
  const isPrimaryGenerateDisabled =
    isGenerating || isQrSessionBusy || Boolean(effectiveSelectedOption.hasRecordedScore);
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

    const nextSearchParams = new URLSearchParams(searchParams);
    if (next.kind === "tournament" && next.matchId && next.tournamentId) {
      nextSearchParams.set("matchId", next.matchId);
      nextSearchParams.set("tournamentId", next.tournamentId);
      resolvedPendingTournamentRef.current = null;
    } else if (
      next.kind === "tournament" &&
      next.tournamentId &&
      isPendingTournamentOptionId(next.id)
    ) {
      nextSearchParams.set("tournamentId", next.tournamentId);
      nextSearchParams.delete("matchId");
      const tournamentName = eligibleTournaments.find(
        (tournament) => tournament.id === next.tournamentId,
      )?.name;
      if (tournamentName?.trim()) {
        nextSearchParams.set("tournamentName", tournamentName.trim());
      } else {
        nextSearchParams.delete("tournamentName");
      }
      resolvedPendingTournamentRef.current = null;
    } else {
      nextSearchParams.delete("matchId");
      nextSearchParams.delete("tournamentId");
      nextSearchParams.delete("tournamentName");
      resolvedPendingTournamentRef.current = null;
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
    setHasUnsavedQrChanges(false);
    setIsMatchPopoverOpen(false);
    setOpenScorePickerKey(null);
    setMatchSearch("");
  };

  const pendingTournamentIdForResolve = useMemo(() => {
    if (mode !== "generate") return null;
    if (!effectiveSelectedOption.tournamentId) return null;
    if (effectiveSelectedOption.matchId) return null;
    if (!isPendingTournamentOptionId(effectiveSelectedOption.id)) return null;
    return effectiveSelectedOption.tournamentId;
  }, [effectiveSelectedOption, mode]);

  const pendingTournamentMatchesQuery = useTournamentMatches(
    pendingTournamentIdForResolve,
    Boolean(pendingTournamentIdForResolve),
  );

  // When the user picks an enrolled tournament without live-match rows yet, load schedule and select the first scorable fixture.
  useEffect(() => {
    if (!pendingTournamentIdForResolve) return;
    if (pendingTournamentMatchesQuery.isPending) return;
    if (resolvedPendingTournamentRef.current === pendingTournamentIdForResolve) return;

    resolvedPendingTournamentRef.current = pendingTournamentIdForResolve;

    const scheduleMatches = pendingTournamentMatchesQuery.data?.matches ?? [];
    const firstScorable = scheduleMatches.find((match) => {
      if (hasRecordedMatchScore(match)) return false;
      return teamIncludesUser(match.side1, userId) || teamIncludesUser(match.side2, userId);
    });

    if (!firstScorable) return;

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.set("tournamentId", pendingTournamentIdForResolve);
    nextSearchParams.set("matchId", firstScorable.id);
    const tournamentName = eligibleTournaments.find(
      (tournament) => tournament.id === pendingTournamentIdForResolve,
    )?.name;
    if (tournamentName?.trim()) {
      nextSearchParams.set("tournamentName", tournamentName.trim());
    }
    navigate(
      { search: `?${nextSearchParams.toString()}` },
      { replace: true },
    );
    setSelectedMatchId(firstScorable.id);
  }, [
    eligibleTournaments,
    navigate,
    pendingTournamentIdForResolve,
    pendingTournamentMatchesQuery.data?.matches,
    pendingTournamentMatchesQuery.isPending,
    searchParams,
    userId,
  ]);

  // Keep URL and selection off completed matches (e.g. deep link after score was recorded).
  useEffect(() => {
    if (mode !== "generate") return;
    if (shouldShowLoadingSkeleton) return;

    const scoredPrefill = Boolean(
      forcedMatchId && preferredGenerateOption?.hasRecordedScore,
    );
    const scoredSelection = Boolean(
      selectedMatchId &&
        matchOptions.find((option) => option.id === selectedMatchId)?.hasRecordedScore,
    );

    if (!scoredPrefill && !scoredSelection) return;
    if (skippedScoredMatchRef.current) return;

    const target =
      pickDefaultScorableTournamentOption(tournamentMatchOptions) ??
      pickDefaultEligibleTournamentOption(eligibleTournamentMatchOptions) ??
      independentOption;

    if (!isScorableMatchOption(target)) {
      skippedScoredMatchRef.current = true;
      navigate("/record-score", { replace: true });
      toast.error(
        t(
          "recordScorePage.enter.errors.matchAlreadyScored",
          "This match already has a recorded score.",
        ),
      );
      return;
    }

    skippedScoredMatchRef.current = true;
    onMatchChange(target.id);
    toast.info(
      t(
        "recordScorePage.enter.matchAlreadyScoredSwitch",
        "That match is already scored. Switched to your next available match.",
      ),
    );
  }, [
    forcedMatchId,
    independentOption,
    matchOptions,
    mode,
    navigate,
    onMatchChange,
    preferredGenerateOption?.hasRecordedScore,
    selectedMatchId,
    shouldShowLoadingSkeleton,
    t,
    eligibleTournamentMatchOptions,
    tournamentMatchOptions,
  ]);

  const onScoreChange = (
    rowId: string,
    side: ScoreEditorSide,
    setIndex: number,
    value: string,
  ) => {
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

      // If an independent session is already active and the user only changed scores,
      // update the existing request in-place (same token/QR) instead of regenerating.
      const activeIndependentRequestId =
        hydratedQrSession?.flow === "independent" ? hydratedQrSession.requestId : null;

      if (
        !options?.forceGenerateNew &&
        hasUnsavedQrChanges &&
        activeIndependentRequestId &&
        effectiveSelectedOption.kind === "independent"
      ) {
        let patchOk = false;
        try {
          await updateScoreQrMutation.mutateAsync({
            requestId: activeIndependentRequestId,
            playerOneScores: input.playerOneScores,
            playerTwoScores: input.playerTwoScores,
          });
          patchOk = true;
          setHasUnsavedQrChanges(false);
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
          } else {
            toast.error(
              getErrorMessage(error) ?? t("recordScorePage.enter.errors.qrGenerateFailed"),
            );
            return null;
          }
        }
        if (patchOk) {
          return hydratedQrSession?.validationUrl ?? null;
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
        setHasUnsavedQrChanges(false);
        // Use the ref (not the closed-over value) so we always stamp the key that is
        // current at the time the response lands, even if external data (liveMatch
        // refetch) shifted the selection while the request was in flight.
        lastAutoGeneratedQrKeyRef.current = currentQrRequestKeyRef.current;
        if (options?.showSuccessToast !== false) {
          toast.success(t("recordScorePage.enter.qrGenerated"));
        }
        return result.qr.validationUrl;
      } catch (error: unknown) {
        toast.error(
          getErrorMessage(error) ?? t("recordScorePage.enter.errors.qrGenerateFailed"),
        );
        return null;
      }
    },
    [
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
      hydratedQrSession,
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

  useEffect(() => {
    attemptedAutoQrKeyRef.current = null;
  }, [currentQrRequestKey]);

  useEffect(() => {
    if (mode !== "generate") return;
    if (isScoreFormValidForQr) return;
    setGeneratedQrDataUrl(null);
    setGeneratedValidationUrl(null);
    setGeneratedExpiresAt(null);
    lastAutoGeneratedQrKeyRef.current = null;
    attemptedAutoQrKeyRef.current = null;
  }, [isScoreFormValidForQr, mode]);

  useEffect(() => {
    if (mode !== "generate") return;
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

    try {
      await confirmScoreQrMutation.mutateAsync({
        token: confirmedToken,
      });
      clearScoreQrToken(confirmedTokenRef);
      toast.success(t("recordScorePage.enter.success"));
      navigate("/record-score", { replace: true });
    } catch (error: unknown) {
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
    isQrDialogOpen,
    setIsQrDialogOpen,
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
    hasValidationLink,
    hasActiveIndependentSession,
    manualPrefillSummaryLabel,
  };
}
