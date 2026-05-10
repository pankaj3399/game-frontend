import { Button } from "@/components/ui/button";

type FooterActionsProps = {
  mode: "confirm" | "generate";
  isSubmittingConfirm: boolean;
  canSubmitConfirmedScore: boolean;
  onSubmitConfirmedScore: () => void;
  onGenerateOrOpenValidationLink: () => void | Promise<void>;
  isPrimaryGenerateDisabled: boolean;
  isGenerating: boolean;
  hasValidationLink: boolean;
  hasUnsavedQrChanges: boolean;
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
  hasValidationLink,
  hasUnsavedQrChanges,
  t,
}: FooterActionsProps) {
  return (
    <footer className="mt-5 sm:mt-4">
      {mode === "confirm" ? (
        <Button
          type="button"
          onClick={onSubmitConfirmedScore}
          disabled={!canSubmitConfirmedScore || isSubmittingConfirm}
          className="min-h-[48px] w-full rounded-[12px] bg-[#067429] text-[15px] font-medium text-white hover:bg-[#056320] sm:h-[34px] sm:min-h-[34px] sm:rounded-[10px] sm:text-[14px]"
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
          className={`min-h-[48px] w-full rounded-[12px] text-[15px] font-medium text-white sm:h-[34px] sm:min-h-[34px] sm:rounded-[10px] sm:text-[14px] ${
            hasUnsavedQrChanges
              ? "bg-[#b45309] hover:bg-[#92400e]"
              : hasValidationLink
                ? "bg-[#1d8ced] hover:bg-[#1476cc]"
                : "bg-[#067429] hover:bg-[#056320]"
          }`}
        >
          {isGenerating
            ? t("recordScorePage.enter.generatingQr")
            : hasValidationLink && hasUnsavedQrChanges
              ? t("recordScorePage.enter.saveChanges")
              : hasValidationLink
                ? t("recordScorePage.enter.shareValidationLink")
                : t("recordScorePage.enter.generateQr")}
        </Button>
      )}
    </footer>
  );
}
