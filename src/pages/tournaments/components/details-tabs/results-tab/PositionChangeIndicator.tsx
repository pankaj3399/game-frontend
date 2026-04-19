import { ChevronDown, ChevronUp, Minus } from "@/icons/figma-icons";
import { cn } from "@/lib/utils";

interface PositionChangeIndicatorProps {
  change: number;
  className?: string;
  iconClassName?: string;
  zeroLabel?: string;
}

export function PositionChangeIndicator({
  change,
  className,
  iconClassName,
  zeroLabel = "0",
}: PositionChangeIndicatorProps) {
  if (change > 0) {
    return (
      <span className={cn("inline-flex items-center gap-0.5 text-sm font-medium text-[#15803d]", className)}>
        <ChevronUp className={cn("size-4", iconClassName)} aria-hidden />
        {change}
      </span>
    );
  }

  if (change < 0) {
    return (
      <span className={cn("inline-flex items-center gap-0.5 text-sm font-medium text-[#dc2626]", className)}>
        <ChevronDown className={cn("size-4", iconClassName)} aria-hidden />
        {Math.abs(change)}
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-0.5 text-sm text-[#6a6a6a]", className)}>
      <Minus className={cn("size-4", iconClassName)} aria-hidden />
      {zeroLabel}
    </span>
  );
}
