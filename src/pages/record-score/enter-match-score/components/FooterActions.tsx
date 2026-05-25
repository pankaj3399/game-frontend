import { Button } from "@/components/ui/button";

type FooterActionsProps = {
  mode: "confirm" | "generate";
  isSubmittingConfirm: boolean;
  canSubmitConfirmedScore: boolean;
  onSubmitConfirmedScore: () => void;
  onGenerateOrOpenValidationLink: () => void | Promise<void>;
  isPrimaryGenerateDisabled: boolean;
  isGenerating: boolean;
  isSyncingQrScores?: boolean;
  hasValidationLink: boolean;
  t: (key: string) => string;
};

export function FooterActions({
  mode,
  isSubmittingConfirm,
  canSubmitConfirmedScore,
  onSubmitConfirmedScore,
  onGenerateOrOpenValidationLink,
  isPrimaryGenerateDisabled,
  isGenerating,
  isSyncingQrScores = false,
  hasValidationLink,
  t,
}: FooterActionsProps) {
  return (
    <footer className="mt-5 sm:mt-4">
      {mode === "confirm" ? (
        <Button
          type="button"
          variant="brand"
          onClick={onSubmitConfirmedScore}
          disabled={!canSubmitConfirmedScore || isSubmittingConfirm}
          className="min-h-[48px] w-full rounded-[12px] sm:h-8 sm:min-h-8 sm:rounded-[10px]"
        >
          {isSubmittingConfirm
            ? t("recordScorePage.enter.submitting")
            : t("recordScorePage.enter.confirmSubmit")}
        </Button>
      ) : (
        <Button
          type="button"
          onClick={onGenerateOrOpenValidationLink}
          disabled={isPrimaryGenerateDisabled}
          className="min-h-[48px] w-full rounded-[12px] bg-[#1d8ced] text-[15px] font-medium text-white hover:bg-[#1476cc] disabled:cursor-not-allowed disabled:bg-[#010a04]/20 sm:h-[34px] sm:min-h-[34px] sm:rounded-[10px] sm:text-[14px]"
        >
          {isSyncingQrScores
            ? t("recordScorePage.enter.savingQrScores")
            : isGenerating
            ? t("recordScorePage.enter.generatingQr")
            : hasValidationLink
              ? t("recordScorePage.enter.shareValidationLink")
              : t("recordScorePage.enter.preparingQr")}
        </Button>
      )}
    </footer>
  );
}
