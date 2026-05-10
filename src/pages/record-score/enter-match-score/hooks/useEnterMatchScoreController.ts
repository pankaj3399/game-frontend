import { useEffect, useMemo, useState } from "react";
import type { TFunction } from "i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";
import { getHttpStatus } from "@/lib/errors";
import {
  useActiveTournamentScoreQrSession,
  useConfirmTournamentScoreQr,
  useGenerateIndependentScoreQr,
  useGenerateTournamentScoreQr,
  useTournamentLiveMatch,
  useValidateTournamentScoreQr,
} from "@/pages/tournaments/hooks";
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
  scoreValueToInput,
} from "../helpers";
import { INDEPENDENT_MATCH_ID, type MatchOption } from "../types";

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
  const [searchParams] = useSearchParams();

  const mode = searchParams.get("mode") === "confirm" ? "confirm" : "generate";
  const confirmedToken = searchParams.get("token")?.trim() ?? "";
  const forcedMatchId = searchParams.get("matchId")?.trim() ?? "";
  const forcedTournamentId = searchParams.get("tournamentId")?.trim() ?? "";
  const preferredGenerateMatchId = mode === "generate" ? forcedMatchId : "";
  const preferredGenerateTournamentId = mode === "generate" ? forcedTournamentId : "";

  const liveMatchQuery = useTournamentLiveMatch(true);
  const validatedScoreQuery = useValidateTournamentScoreQr(
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

  const [rows, setRows] = useState<ScoreEditorRow[]>(() =>
    createRowsForPlayMode(effectiveSelectedOption.playMode),
  );

  useEffect(() => {
    if (mode !== "generate") return;
    if (hydratedQrSession) return;
    if (hasUnsavedQrChanges) return;
    setRows((prev) => {
      const nextTemplate = createRowsForPlayMode(effectiveSelectedOption.playMode);
      if (prev.length === nextTemplate.length) return prev;
      return nextTemplate;
    });
  }, [mode, hydratedQrSession, hasUnsavedQrChanges, effectiveSelectedOption.playMode]);

  const isConfirmLocked = mode === "confirm";
  const isValidatedContextOk =
    mode !== "confirm" ||
    Boolean(
      resolvedConfirmMatchId &&
        effectiveSelectedOption.matchId === resolvedConfirmMatchId &&
        (effectiveSelectedOption.tournamentId ?? "") ===
          (resolvedConfirmTournamentId ?? ""),
    );
  const shouldRedirectInvalidConfirm =
    mode === "confirm" &&
    !validatedScoreQuery.isLoading &&
    (validatedScoreQuery.isError || !validatedScoreQuery.data?.valid || !validatedRequest);

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
      effectiveSelectedOption.tournamentId && effectiveSelectedOption.matchId,
    );

  const effectiveValidationUrl = useMemo(() => {
    if (mode === "confirm" && confirmedToken && typeof window !== "undefined") {
      return `${window.location.origin}/record-score/validate?token=${encodeURIComponent(confirmedToken)}`;
    }
    return generatedValidationUrl;
  }, [confirmedToken, generatedValidationUrl, mode]);

  const effectiveExpiresAt = useMemo(
    () =>
      mode === "confirm" ? (validatedRequest?.expiresAt ?? null) : generatedExpiresAt,
    [generatedExpiresAt, mode, validatedRequest?.expiresAt],
  );

  const areMatchOptionsResolving =
    liveMatchQuery.isLoading || (liveMatchQuery.isFetching && !liveMatchQuery.data);
  const hydratedMatchOption = useMemo(() => {
    if (!hydratedQrSession) return null;
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
  }, [hydratedQrSession, matchOptions]);
  const hydratedRows = useMemo(() => {
    if (!hydratedQrSession) return null;
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
  }, [effectiveSelectedOption.playMode, hydratedMatchOption?.playMode, hydratedQrSession]);
  const isQrHydrationLoading =
    mode === "generate" &&
    (activeSessionQuery.isLoading || activeSessionQuery.isFetching);
  const shouldUseHydratedState =
    mode === "generate" &&
    !generatedValidationUrl &&
    !hasUnsavedQrChanges &&
    Boolean(hydratedQrSession);
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
    isQrHydrationLoading ||
    (mode === "confirm" && validatedScoreQuery.isLoading);

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
    setRows(createRowsForPlayMode(next.playMode));
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
    setRows(
      applyScoreInputChange(
        sourceRows,
        rowId,
        side,
        value,
        effectiveSelectedOption.playMode,
        setIndex,
      ),
    );
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

  const onGenerateOrOpenValidationLink = async () => {
    if (mode === "generate" && hasValidationLink && hasUnsavedQrChanges) {
      await onGenerateQr();
      return;
    }
    if (activeValidationUrl) {
      window.open(activeValidationUrl, "_blank", "noopener,noreferrer");
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
