import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { IconScanBarcode } from "@/icons/figma-icons";
import { cn } from "@/lib/utils";

interface MyScoreRecordScoreLinkProps {
  to: string;
  className?: string;
}

/** Record-score CTA — matches MatchScheduleCard button styling. */
export function MyScoreRecordScoreLink({ to, className }: MyScoreRecordScoreLinkProps) {
  const { t } = useTranslation();

  return (
    <Button
      asChild
      size="sm"
      className={cn(
        "h-7 min-w-0 shrink-0 rounded-[7px] border border-[#010a04]/[0.12] bg-white px-2.5 text-[12px] font-medium text-[#010a04] shadow-none hover:bg-[#010a04]/[0.04]",
        className,
      )}
    >
      <Link
        to={to}
        onClick={(event) => event.stopPropagation()}
        className="inline-flex items-center gap-1.5"
      >
        <IconScanBarcode size={13} aria-hidden className="shrink-0 text-current" />
        {t("tournaments.recordScoreCta")}
      </Link>
    </Button>
  );
}
