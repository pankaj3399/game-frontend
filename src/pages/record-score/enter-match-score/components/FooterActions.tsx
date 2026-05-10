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
    <footer className="mt-4">
      {mode === "confirm" ? (
        <Button
          type="button"
          onClick={onSubmitConfirmedScore}
          disabled={!canSubmitConfirmedScore || isSubmittingConfirm}
          className="h-[34px] w-full rounded-[10px] bg-[#067429] text-[14px] font-medium text-white hover:bg-[#056320]"
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
          className={`h-[34px] w-full rounded-[10px] text-[14px] font-medium text-white ${
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
                ? t("recordScorePage.enter.openValidationLink")
                : t("recordScorePage.enter.generateQr")}
        </Button>
      )}
    </footer>
  );
}
