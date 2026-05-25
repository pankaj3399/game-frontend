import { useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { PLAY_MODES } from "@/constants/tournament";
import { useAuth } from "@/pages/auth/hooks";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TournamentPlayMode } from "@/models/tournament/types";
import { IconChevronLeft } from "@/icons/figma-icons";
import { FooterActions } from "./enter-match-score/components/FooterActions";
import { MatchSelector } from "./enter-match-score/components/MatchSelector";
import { QrPreview } from "./enter-match-score/components/QrPreview";
import { ScoreGrid } from "./enter-match-score/components/ScoreGrid";
import {
  matchRoundDisplayLabel,
  playModeTranslationKey,
} from "./enter-match-score/helpers";
import { useEnterMatchScoreController } from "./enter-match-score/hooks/useEnterMatchScoreController";
import { EnterMatchScorePageSkeleton } from "./components/EnterMatchScorePageSkeleton";
import { cn } from "@/lib/utils";

export default function EnterMatchScorePage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const {
    mode,
    isMatchPopoverOpen,
    setIsMatchPopoverOpen,
    openScorePickerKey,
    setOpenScorePickerKey,
    matchSearch,
    setMatchSearch,
    filteredMatchOptions,
    effectiveSelectedOption,
    isConfirmLocked,
    shouldRedirectInvalidConfirm,
    confirmRedirectReason,
    onGoBack,
    onMatchChange,
    onIndependentPlayModeChange,
    onNewIndependentMatch,
    effectiveRows,
    onScoreChange,
    expiresAtLabel,
    activeQrDataUrl,
    shouldShowLoadingSkeleton,
    isConfirmSubmitting,
    canSubmitConfirmedScore,
    onSubmitConfirmedScore,
    onGenerateOrOpenValidationLink,
    isGenerating,
    hasValidationLink,
    isPrimaryGenerateDisabled,
    isSyncingQrScores,
    isScoreEntryLocked,
    hasActiveIndependentSession,
  } = useEnterMatchScoreController({
    t,
    language: i18n.language,
    user: user ?? null,
  });

  const showIndependentScoringPreset =
    mode === "generate" && effectiveSelectedOption.kind === "independent";

  const invalidConfirmToastShownRef = useRef(false);
  useEffect(() => {
    if (!shouldRedirectInvalidConfirm || !confirmRedirectReason) return;
    if (invalidConfirmToastShownRef.current) return;
    invalidConfirmToastShownRef.current = true;
    if (confirmRedirectReason === "wrong-user") {
      toast.error(
        t(
          "recordScorePage.enter.errors.confirmLinkWrongUser",
          "This validation link is not valid for your account.",
        ),
      );
      return;
    }
    if (confirmRedirectReason === "load-failed") {
      toast.error(
        t(
          "recordScorePage.enter.errors.confirmDetailsUnavailable",
          "Could not load match details. Try scanning the QR again.",
        ),
      );
      return;
    }
    toast.error(
      t(
        "recordScorePage.enter.errors.confirmLinkInvalid",
        "This QR link is invalid, expired, or already used.",
      ),
    );
  }, [confirmRedirectReason, shouldRedirectInvalidConfirm, t]);

  const matchMetaLabel = `${t(
    playModeTranslationKey(effectiveSelectedOption.playMode),
  )} · ${matchRoundDisplayLabel(t, effectiveSelectedOption)}`;

  if (shouldRedirectInvalidConfirm) {
    return <Navigate to="/record-score" replace />;
  }

  return (
    <>
      <div className="relative min-h-[calc(100vh-56px)] bg-[#dfe2e0] px-4 pb-8 pt-4 sm:px-6 sm:pb-10 sm:pt-8 lg:min-h-[calc(100vh-60px)] lg:pt-9">
        {shouldShowLoadingSkeleton ? (
          <EnterMatchScorePageSkeleton
            variant={mode === "confirm" ? "confirm" : "generate"}
            statusMessage={
              mode === "confirm"
                ? t("recordScorePage.enter.confirmContextLoading", "Loading match details…")
                : t("recordScorePage.enter.sessionLoading")
            }
          />
        ) : (
          <div className="mx-auto w-full max-w-[992px]">
            <div className="mx-auto w-full max-w-[784px]">
              {mode !== "confirm" ? (
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={onGoBack}
                    className="-ml-1 inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-1 py-2 text-[13px] font-medium text-[#010a04] transition-opacity hover:opacity-65 sm:min-h-0 sm:py-0 sm:text-[12px]"
                  >
                    <IconChevronLeft size={16} className="shrink-0 text-[#010a04] sm:size-[14px]" />
                    {t("recordScorePage.goBack")}
                  </button>

                  {hasActiveIndependentSession ? (
                    <button
                      type="button"
                      id="new-independent-match-btn"
                      onClick={onNewIndependentMatch}
                      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-2 py-2 text-[13px] font-medium text-[#067429] transition-opacity hover:opacity-65 sm:min-h-0 sm:py-0 sm:text-[12px]"
                    >
                      + {t("recordScorePage.enter.newIndependentMatch", { defaultValue: "New match" })}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>

            <section
              className="mx-auto mt-2 w-full max-w-[784px] rounded-[12px] border border-[rgba(1,10,4,0.08)] bg-white p-4 shadow-[0_3px_7.5px_rgba(0,0,0,0.06)] sm:mt-3 sm:p-[18px]"
              aria-busy={isGenerating || isSyncingQrScores}
            >
              <div className="mt-1 flex flex-col gap-1 sm:mt-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h1 className="text-[1.125rem] font-semibold leading-snug tracking-tight text-[#010a04] sm:text-2xl">
                    {mode === "confirm"
                      ? t("recordScorePage.enter.validateTitle")
                      : t("recordScorePage.enter.title")}
                  </h1>
                </div>
                {expiresAtLabel ? (
                  <p className="text-[12px] leading-[1.35] text-[#010a04]/65 sm:pt-1 sm:text-right">
                    {t("recordScorePage.enter.qrExpiresAt", {
                      expiresAt: expiresAtLabel,
                    })}
                  </p>
                ) : null}
              </div>

              <div
                className={cn(
                  "mt-5 flex flex-col gap-5",
                  (activeQrDataUrl || isGenerating) &&
                    "border-t border-[#010a04]/[0.06] pt-5 sm:mt-4 sm:pt-5",
                )}
              >
                {activeQrDataUrl || isGenerating ? (
                  <div className="relative flex w-full justify-center">
                    <QrPreview
                      dataUrl={activeQrDataUrl}
                      isGenerating={isGenerating}
                      t={t}
                    />
                  </div>
                ) : null}

                <div className="min-w-0 flex-1 space-y-4">
                  <div className="space-y-2.5">
                    <div
                      className={cn(
                        "grid min-w-0 grid-cols-1 gap-2.5 sm:items-end",
                        showIndependentScoringPreset &&
                          "sm:grid-cols-[minmax(0,1fr)_190px]",
                      )}
                    >
                      <div className="min-w-0">
                        <MatchSelector
                          isConfirmLocked={isConfirmLocked}
                          isMatchPopoverOpen={isMatchPopoverOpen}
                          setIsMatchPopoverOpen={setIsMatchPopoverOpen}
                          matchSearch={matchSearch}
                          setMatchSearch={setMatchSearch}
                          filteredMatchOptions={filteredMatchOptions}
                          effectiveSelectedOption={effectiveSelectedOption}
                          onMatchChange={onMatchChange}
                          t={t}
                        />
                      </div>

                      {showIndependentScoringPreset ? (
                        <div className="min-w-0 w-full space-y-1.5">
                          <label
                            htmlFor="independent-play-mode"
                            className="text-[12px] font-medium text-[#010a04]/65"
                          >
                            {t("recordScorePage.enter.matchTypeLabel")}
                          </label>
                          <Select
                            value={effectiveSelectedOption.playMode}
                            onValueChange={(value: TournamentPlayMode) =>
                              onIndependentPlayModeChange(value)
                            }
                          >
                            <SelectTrigger
                              id="independent-play-mode"
                              className="h-9 rounded-[10px] border-[#010a04]/[0.12] bg-white text-[13px] font-medium text-[#010a04] shadow-none"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PLAY_MODES.map((playMode) => (
                                <SelectItem
                                  key={playMode.value}
                                  value={playMode.value}
                                >
                                  {t(playMode.labelKey)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : null}
                    </div>

                    <p className="text-[12px] leading-relaxed text-[#010a04]/55 sm:leading-[1.35]">
                      {effectiveSelectedOption.kind === "independent"
                        ? t("recordScorePage.enter.independentHint")
                        : mode === "confirm"
                          ? t("recordScorePage.enter.confirmModeHint")
                          : t("recordScorePage.enter.tournamentHint")}
                    </p>

                  </div>

                  <div className="relative pt-1">
                    {isSyncingQrScores ? (
                      <p className="mb-2 text-[12px] font-medium text-[#010a04]/55">
                        {t(
                          "recordScorePage.enter.savingQrScores",
                          "Saving score to your QR session…",
                        )}
                      </p>
                    ) : null}
                    <div
                      className={cn(
                        "space-y-3 transition-opacity",
                        isSyncingQrScores && "pointer-events-none opacity-60",
                      )}
                    >
                      <div className="flex min-w-0 flex-row flex-wrap items-center gap-2">
                        <h2 className="min-w-0 text-[20px] font-semibold leading-tight text-[#010a04] sm:text-2xl">
                          {t("recordScorePage.enter.matchScores")}
                        </h2>
                        <p
                          className="w-fit max-w-full shrink-0 whitespace-normal rounded-full bg-[#010a04]/[0.04] px-2.5 py-1 text-center text-[12px] font-semibold leading-snug text-[#010a04]/70 sm:text-[13px]"
                          title={matchMetaLabel}
                        >
                          {matchMetaLabel}
                        </p>
                      </div>

                      <ScoreGrid
                        rows={effectiveRows}
                        playMode={effectiveSelectedOption.playMode}
                        playerOneRowLabel={effectiveSelectedOption.playerOneRowLabel}
                        playerTwoRowLabel={effectiveSelectedOption.playerTwoRowLabel}
                        playerOneAvatarUrl={effectiveSelectedOption.playerOneAvatarUrl}
                        playerTwoAvatarUrl={effectiveSelectedOption.playerTwoAvatarUrl}
                        avatarToneSeedPrefix={effectiveSelectedOption.id}
                        isConfirmLocked={isScoreEntryLocked}
                        openScorePickerKey={openScorePickerKey}
                        setOpenScorePickerKey={setOpenScorePickerKey}
                        onScoreChange={onScoreChange}
                        t={t}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {mode === "confirm" ? (
                <FooterActions
                  mode="confirm"
                  isSubmittingConfirm={isConfirmSubmitting}
                  canSubmitConfirmedScore={canSubmitConfirmedScore}
                  onSubmitConfirmedScore={onSubmitConfirmedScore}
                  onGenerateOrOpenValidationLink={onGenerateOrOpenValidationLink}
                  isPrimaryGenerateDisabled={isPrimaryGenerateDisabled}
                  isGenerating={isGenerating}
                  isSyncingQrScores={isSyncingQrScores}
                  hasValidationLink={hasValidationLink}
                  t={(key: string) => t(key)}
                />
              ) : null}
            </section>
          </div>
        )}
      </div>

    </>
  );
}
