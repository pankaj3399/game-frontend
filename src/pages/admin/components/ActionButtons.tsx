import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ActionButtonsProps {
  isPending: boolean;
  hasUnsavedChanges: boolean;
  onDiscard: () => void;
  onSave: () => void | Promise<void>;
  className?: string;
}

export function ActionButtons({
  isPending,
  hasUnsavedChanges,
  onDiscard,
  onSave,
  className,
}: ActionButtonsProps) {
  const { t } = useTranslation();
  const disabled = isPending || !hasUnsavedChanges;

  return (
    <div className={cn(className)}>
      <Button
        type="button"
        variant="outline"
        onClick={onDiscard}
        disabled={disabled}
        className="h-[42px] flex-1 rounded-[10px] border border-[rgba(1,10,4,0.2)] bg-white px-[18px] text-[16px] font-medium text-[#010a04] shadow-none hover:bg-white md:flex-none"
      >
        {t("admin.clubSubscription.discard")}
      </Button>
      <Button
        type="button"
        onClick={onSave}
        disabled={disabled}
        className="h-[42px] flex-1 rounded-[8px] bg-linear-to-r from-[#0a6925] via-[#0c7b2c] to-[#0f8d33] px-[16px] text-[16px] font-medium text-white hover:opacity-95 md:flex-none"
      >
        {isPending ? t("admin.clubSubscription.saving") : t("admin.clubSubscription.saveChanges")}
      </Button>
    </div>
  );
}
