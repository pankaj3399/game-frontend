import { Link } from "react-router-dom";
import { IconScanBarcode } from "@/icons/figma-icons";
import { cn } from "@/lib/utils";

interface MyScoreRecordScoreLinkProps {
  to: string;
  label: string;
  className?: string;
}

/** Subtle inline icon action for matches that still need a score recorded. */
export function MyScoreRecordScoreLink({ to, label, className }: MyScoreRecordScoreLinkProps) {
  return (
    <Link
      to={to}
      aria-label={label}
      title={label}
      onClick={(event) => event.stopPropagation()}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-sm text-brand-primary/85 transition-colors hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40",
        className,
      )}
    >
      <IconScanBarcode size={13} aria-hidden className="shrink-0 text-current" />
    </Link>
  );
}
