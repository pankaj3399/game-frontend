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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { cn } from "@/lib/utils";

export default function EnterMatchScorePage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const {
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
          <div
            className="min-h-[calc(100vh-56px)] px-0 pb-10 pt-0 sm:px-0 sm:pt-0 lg:min-h-[calc(100vh-60px)] lg:pt-0"
            aria-busy="true"
            aria-live="polite"
          >
            <span className="sr-only" role="status">
              {t("recordScorePage.enter.sessionLoading")}
            </span>
            <div className="mx-auto w-full max-w-[992px]">
              <div className="mx-auto w-full max-w-[784px]">
                {mode !== "confirm" ? (
                  <div className="h-4 w-20 animate-skeleton-soft rounded bg-[#010a04]/10" />
                ) : null}
              </div>

              <section className="mx-auto mt-3 w-full max-w-[784px] rounded-[12px] border border-[rgba(1,10,4,0.08)] bg-white p-4 shadow-[0_3px_7.5px_rgba(0,0,0,0.06)] sm:p-[18px]">
                <div className="mt-2 flex min-w-0 flex-row flex-wrap items-center gap-2">
                  <div className="h-7 w-52 shrink-0 animate-skeleton-soft rounded bg-[#010a04]/10 sm:h-8 sm:w-64" />
                  <div className="h-7 w-36 shrink-0 animate-skeleton-soft rounded-full bg-[#010a04]/8 sm:h-8" />
                </div>

                <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="h-[130px] w-[130px] animate-skeleton-soft rounded-[8px] bg-[#010a04]/8" />

                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="h-[34px] w-full animate-skeleton-soft rounded-[8px] bg-[#010a04]/8" />
                    <div className="h-4 w-[78%] animate-skeleton-soft rounded bg-[#010a04]/8" />
                    <div className="h-7 w-40 animate-skeleton-soft rounded bg-[#010a04]/10" />

                    <div className="space-y-3 sm:space-y-2.5">
                      {Array.from({ length: 2 }).map((_, rowIndex) => (
                        <div
                          key={`score-skeleton-row-${rowIndex}`}
                          className="rounded-[12px] border border-[#010a04]/[0.06] bg-[#f4f6f5] p-3 sm:grid sm:grid-cols-[140px_minmax(0,1fr)] sm:items-center sm:gap-3 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0"
                        >
                          <div className="h-4 w-24 animate-skeleton-soft rounded bg-[#010a04]/8 sm:h-4" />
                          <div className="mt-2 grid grid-cols-3 gap-2.5 sm:mt-0 sm:gap-2">
                            {Array.from({ length: 3 }).map((__, colIndex) => (
                              <div
                                key={`score-skeleton-cell-${rowIndex}-${colIndex}`}
                                className="h-[44px] animate-skeleton-soft rounded-[10px] bg-[#010a04]/8 sm:h-[34px] sm:rounded-[8px]"
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 h-[34px] w-full animate-skeleton-soft rounded-[10px] bg-[#010a04]/10" />
              </section>
            </div>
          </div>
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
              aria-busy={isGenerating}
            >
              <div className="mt-1 flex flex-col gap-1 sm:mt-2 sm:flex-row sm:items-start sm:justify-between">
                <h1 className="text-[1.125rem] font-semibold leading-snug tracking-tight text-[#010a04] sm:text-2xl">
                  {mode === "confirm"
                    ? t("recordScorePage.enter.validateTitle")
                    : t("recordScorePage.enter.title")}
                </h1>
                {expiresAtLabel ? (
                  <p className="text-[12px] leading-[1.35] text-[#010a04]/65 sm:pt-1 sm:text-right">
                    {t("recordScorePage.enter.qrExpiresAt", {
                      expiresAt: expiresAtLabel,
                    })}
                  </p>
                ) : null}
              </div>

              <div className="mt-5 flex flex-col gap-5 border-t border-[#010a04]/[0.06] pt-5 sm:mt-4 sm:flex-row sm:items-start sm:gap-6 sm:border-t-0 sm:pt-0">
                {activeQrDataUrl || isGenerating ? (
                  <div className="relative flex shrink-0 justify-center sm:justify-start">
                    <QrPreview
                      dataUrl={activeQrDataUrl}
                      isGenerating={isGenerating}
                      onOpenLarge={() => setIsQrDialogOpen(true)}
                      onCopyLink={onGenerateOrOpenValidationLink}
                      hasValidationLink={hasValidationLink}
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

                    {mode === "confirm" && !isValidatedContextOk ? (
                      <p className="text-[12px] leading-[1.35] text-[#a33d3d]">
                        {t("recordScorePage.enter.validatedMatchOnlyHint")}
                      </p>
                    ) : null}
                  </div>

                  <div className="relative pt-1">
                    <div className="space-y-3 transition-opacity">
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
                        isConfirmLocked={isConfirmLocked}
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
                  hasValidationLink={hasValidationLink}
                  t={(key: string) => t(key)}
                />
              ) : null}
            </section>
          </div>
        )}
      </div>

      <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
        <DialogContent
          showCloseButton
          className="max-w-[560px] rounded-[14px] border border-[#010a04]/10 bg-white p-5"
        >
          <DialogHeader>
            <DialogTitle className="text-[20px] font-semibold text-[#010a04]">
              {t("recordScorePage.enter.qrPreviewTitle")}
            </DialogTitle>
          </DialogHeader>

          {activeQrDataUrl ? (
            <div className="mt-2 flex flex-col items-center gap-3">
              <div className="rounded-[12px] border border-[#010a04]/10 bg-white p-3">
                <img
                  src={activeQrDataUrl}
                  alt={t("recordScorePage.enter.qrPreviewLargeAlt")}
                  className="h-[360px] w-[360px] max-w-[78vw] object-contain"
                />
              </div>
              <p className="text-center text-[12px] text-[#010a04]/60">
                {t("recordScorePage.enter.qrPreviewHelp")}
              </p>
            </div>
          ) : (
            <p className="text-[13px] text-[#010a04]/60">
              {t("recordScorePage.enter.qrPreviewEmpty")}
            </p>
          )}
        </DialogContent>
      </Dialog>

    </>
  );
}
