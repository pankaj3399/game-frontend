import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import type { TFunction } from "i18next";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { getErrorMessage, getHttpStatus } from "@/lib/errors";
import { useTournamentLiveMatch } from "@/pages/tournaments/hooks/useTournamentLiveMatch";
import {
  useActiveTournamentScoreQrSession,
  useConfirmTournamentScoreQr,
  useGenerateIndependentScoreQr,
  useGenerateTournamentScoreQr,
  useValidateTournamentScoreQrConfirmContext,
} from "@/pages/tournaments/hooks/useTournamentScoreQr";
import {
  applyScoreInputChange,
  buildScorePayload,
  type ScoreEditorRow,
  type ScoreEditorSide,
} from "@/pages/tournaments/schedule/utils/matchScheduleScore";
import type { RecordTournamentMatchScoreInput } from "@/models/tournament/types";
import {
  buildMatchLabel,
  createRowsForPlayMode,
  formatExpiry,
  formatLiveMatchTeamLabel,
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

type UseEnterMatchScoreControllerParams = {
  t: TFunction;
  language: string;
  userId: string | null;
};

export function useEnterMatchScoreController({
  t,
  language,
  userId,
}: UseEnterMatchScoreControllerParams) {
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
  const preferredGenerateMatchId = mode === "generate" ? forcedMatchId : "";
  const preferredGenerateTournamentId = mode === "generate" ? forcedTournamentId : "";

  const liveMatchQuery = useTournamentLiveMatch(true);
  const validatedScoreQuery = useValidateTournamentScoreQrConfirmContext(
    confirmedToken,
    mode === "confirm" && Boolean(confirmedToken),
  );
  const generateTournamentQrMutation = useGenerateTournamentScoreQr();
  const generateIndependentQrMutation = useGenerateIndependentScoreQr();
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

  const independentOption = useMemo<MatchOption>(
    () => ({
      id: INDEPENDENT_MATCH_ID,
      label: t("recordScorePage.enter.independentMatch"),
      playMode: "TieBreak10",
      mode: "singles",
      kind: "independent",
      tournamentId: null,
      matchId: null,
      isLive: false,
      isPendingScore: false,
      round: null,
      playerOneRowLabel: t("recordScorePage.enter.independentYourTeam"),
      playerTwoRowLabel: t("recordScorePage.enter.independentOpponentTeam"),
    }),
    [t],
  );

  const tournamentMatchOptions = useMemo<MatchOption[]>(() => {
    const normalizedLiveMatchId = liveMatch?.id ?? null;
    return inFlightMatches
      .filter((match) => match.tournament.id != null)
      .filter(
        (match) => match.status === "inProgress" || match.status === "pendingScore",
      )
      .filter((match) => {
        if (!userId) return true;
        return (
          match.myTeam.some((player) => player.id === userId) ||
          match.opponentTeam.some((player) => player.id === userId)
        );
      })
      .map((match) => ({
        id: match.id,
        label: buildMatchLabel(t, match),
        playMode: match.playMode ?? "TieBreak10",
        mode: match.mode,
        kind: "tournament" as const,
        tournamentId: match.tournament.id,
        matchId: match.id,
        round: match.round,
        playerOneRowLabel: formatLiveMatchTeamLabel(match.myTeam, t),
        playerTwoRowLabel: formatLiveMatchTeamLabel(match.opponentTeam, t),
        isLive:
          match.status === "inProgress" ||
          (normalizedLiveMatchId != null && match.id === normalizedLiveMatchId),
        isPendingScore: match.status === "pendingScore",
      }))
      .sort((a, b) => {
        if (a.isLive && !b.isLive) return -1;
        if (!a.isLive && b.isLive) return 1;
        if (a.isPendingScore && !b.isPendingScore) return -1;
        if (!a.isPendingScore && b.isPendingScore) return 1;
        return a.label.localeCompare(b.label);
      });
  }, [inFlightMatches, liveMatch?.id, t, userId]);

  const matchOptions = useMemo(
    () => [...tournamentMatchOptions, independentOption],
    [independentOption, tournamentMatchOptions],
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
    return {
      id: resolvedConfirmMatchId,
      label:
        matchedLiveItem != null
          ? buildMatchLabel(t, matchedLiveItem)
          : t("recordScorePage.enter.validatedMatchFallback", {
              defaultValue: "Validated match",
            }),
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
      isLive: false,
      isPendingScore: true,
    } satisfies MatchOption;
  }, [
    inFlightMatches,
    matchOptions,
    mode,
    resolvedConfirmMatchId,
    resolvedConfirmTournamentId,
    t,
    validatedRequest,
  ]);

  const defaultOption = useMemo(
    () =>
      forcedOption ??
      tournamentMatchOptions.find((option) => option.isLive) ??
      tournamentMatchOptions[0] ??
      independentOption,
    [forcedOption, independentOption, tournamentMatchOptions],
  );

  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const preferredGenerateOption = useMemo(() => {
    if (!preferredGenerateMatchId) return null;
    return (
      matchOptions.find(
        (option) =>
          option.kind === "tournament" &&
          option.matchId === preferredGenerateMatchId &&
          (option.tournamentId ?? "") === (preferredGenerateTournamentId ?? ""),
      ) ?? null
    );
  }, [matchOptions, preferredGenerateMatchId, preferredGenerateTournamentId]);
  const resolvedSelectedMatchId = selectedMatchId ?? defaultOption.id;

  const filteredMatchOptions = useMemo(() => {
    const query = matchSearch.trim().toLowerCase();
    if (!query) return matchOptions;
    return matchOptions.filter((option) => option.label.toLowerCase().includes(query));
  }, [matchOptions, matchSearch]);

  const effectiveSelectedOption = useMemo(() => {
    if (mode === "confirm" && forcedOption) return forcedOption;
    if (mode === "generate" && selectedMatchId == null && preferredGenerateOption) {
      return preferredGenerateOption;
    }
    return (
      matchOptions.find((option) => option.id === resolvedSelectedMatchId) ??
      forcedOption ??
      defaultOption
    );
  }, [
    defaultOption,
    forcedOption,
    matchOptions,
    mode,
    preferredGenerateOption,
    resolvedSelectedMatchId,
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

  const activeSessionQuery = useActiveTournamentScoreQrSession(
    activeSessionQueryInput,
    mode === "generate" && Boolean(activeSessionQueryInput),
  );
  const hydratedQrSession = activeSessionQuery.data?.session ?? null;

  const qrSessionMatchesSelection = useMemo(() => {
    if (!hydratedQrSession) return true;
    if (effectiveSelectedOption.kind === "independent") {
      return hydratedQrSession.flow === "independent";
    }
    return (
      hydratedQrSession.flow === "tournament" &&
      hydratedQrSession.matchId === effectiveSelectedOption.matchId &&
      (hydratedQrSession.tournamentId ?? "") ===
        (effectiveSelectedOption.tournamentId ?? "")
    );
  }, [effectiveSelectedOption, hydratedQrSession]);

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
  const shouldRedirectInvalidConfirm =
    mode === "confirm" &&
    !validatedScoreQuery.isPending &&
    (unreadableQrRefWithoutTokenFallback ||
      (Boolean(confirmedToken) &&
        (validatedScoreQuery.isError ||
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
    generateTournamentQrMutation.isPending || generateIndependentQrMutation.isPending;
  const canGenerateQr =
    mode === "generate" &&
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
    !hasUnsavedQrChanges &&
    Boolean(hydratedQrSession) &&
    qrSessionMatchesSelection;
  const activeQrDataUrl =
    generatedQrDataUrl ??
    (shouldUseHydratedState ? hydratedQrSession?.qrDataUrl ?? null : null);
  const activeValidationUrl =
    mode === "confirm"
      ? effectiveValidationUrl
      : generatedValidationUrl ??
        (shouldUseHydratedState ? hydratedQrSession?.validationUrl ?? null : null);
  const activeExpiresAt =
    mode === "confirm"
      ? effectiveExpiresAt
      : generatedExpiresAt ??
        (shouldUseHydratedState ? hydratedQrSession?.expiresAt ?? null : null);
  const expiresAtLabel = useMemo(
    () =>
      formatExpiry(
        mode === "confirm" ? effectiveExpiresAt : activeExpiresAt,
        language,
      ),
    [activeExpiresAt, effectiveExpiresAt, language, mode],
  );

  const shouldShowLoadingSkeleton =
    areMatchOptionsResolving ||
    (mode === "confirm" && Boolean(confirmedToken) && validatedScoreQuery.isPending) ||
    (mode === "generate" && Boolean(activeSessionQueryInput) && isQrSessionBusy);

  const generateRows = shouldUseHydratedState && hydratedRows ? hydratedRows : rows;
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
          (_, index) => ({
            id: `set-${index + 1}`,
            playerOne:
              index < validatedRequest.playerOneScores.length
                ? scoreValueToInput(validatedRequest.playerOneScores[index])
                : "",
            playerTwo:
              index < validatedRequest.playerTwoScores.length
                ? scoreValueToInput(validatedRequest.playerTwoScores[index])
                : "",
            lastEditedSide: null,
          }),
        );

  const isScoreFormValidForQr = buildScorePayload(
    effectiveRows,
    effectiveSelectedOption.playMode,
    t,
  ).ok;
  const hasValidationLink = Boolean(activeValidationUrl);
  const isGenerateState = mode === "generate" && !hasValidationLink;
  const isSaveChangesState =
    mode === "generate" && hasValidationLink && hasUnsavedQrChanges;
  const isPrimaryGenerateDisabled =
    isGenerating ||
    isQrSessionBusy ||
    ((isGenerateState || isSaveChangesState) &&
      (!canGenerateQr || !isScoreFormValidForQr));

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

    const nextSearchParams = new URLSearchParams(searchParams);
    if (next.kind === "tournament" && next.matchId && next.tournamentId) {
      nextSearchParams.set("matchId", next.matchId);
      nextSearchParams.set("tournamentId", next.tournamentId);
    } else {
      nextSearchParams.delete("matchId");
      nextSearchParams.delete("tournamentId");
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

  const buildCurrentScoreInput = (): RecordTournamentMatchScoreInput | null => {
    const payload = buildScorePayload(
      effectiveRows,
      effectiveSelectedOption.playMode,
      t,
    );
    if (!payload.ok) {
      toast.error(payload.message ?? t("recordScorePage.enter.errors.invalid"));
      return null;
    }

    return {
      playerOneScores: payload.playerOneScores,
      playerTwoScores: payload.playerTwoScores,
    };
  };

  const onGenerateQr = async () => {
    if (!canGenerateQr) {
      toast.error(t("recordScorePage.enter.errors.noTournamentMatchSelected"));
      return;
    }

    const input = buildCurrentScoreInput();
    if (!input) return;

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
          : await generateIndependentQrMutation.mutateAsync(input);

      setGeneratedQrDataUrl(result.qr.dataUrl);
      setGeneratedValidationUrl(result.qr.validationUrl);
      setGeneratedExpiresAt(result.qr.expiresAt);
      setHasUnsavedQrChanges(false);
      toast.success(t("recordScorePage.enter.qrGenerated"));
    } catch (error: unknown) {
      toast.error(
        getErrorMessage(error) ?? t("recordScorePage.enter.errors.qrGenerateFailed"),
      );
    }
  };

  const shareOrCopyValidationUrl = async (url: string) => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: t("recordScorePage.enter.validationLinkShareTitle"),
          text: t("recordScorePage.enter.validationLinkShareText"),
          url,
        });
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
    if (mode === "generate" && hasValidationLink && hasUnsavedQrChanges) {
      await onGenerateQr();
      return;
    }
    if (
      mode === "generate" &&
      hasValidationLink &&
      activeValidationUrl &&
      !hasUnsavedQrChanges
    ) {
      await shareOrCopyValidationUrl(activeValidationUrl);
      return;
    }
    await onGenerateQr();
  };

  const onSubmitConfirmedScore = async () => {
    if (!canSubmitConfirmedScore) {
      toast.error(t("recordScorePage.enter.errors.noTournamentMatchSelected"));
      return;
    }

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
    effectiveSelectedOption,
    isConfirmLocked,
    isValidatedContextOk,
    shouldRedirectInvalidConfirm,
    confirmRedirectReason,
    onGoBack,
    onMatchChange,
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
  };
}
