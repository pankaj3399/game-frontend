import { ChevronDown, ChevronUp, Minus } from "@/icons/figma-icons";

interface PositionChangeIndicatorProps {
  change: number;
  className?: string;
  iconClassName?: string;
  zeroLabel?: string;
}

function joinClasses(...values: Array<string | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export function PositionChangeIndicator({
  change,
  className,
  iconClassName,
  zeroLabel = "0",
}: PositionChangeIndicatorProps) {
  if (change > 0) {
    return (
      <span className={joinClasses("inline-flex items-center gap-0.5 text-sm font-medium text-[#15803d]", className)}>
        <ChevronUp className={joinClasses("size-4", iconClassName)} aria-hidden />
        {change}
      </span>
    );
  }

  if (change < 0) {
    return (
      <span className={joinClasses("inline-flex items-center gap-0.5 text-sm font-medium text-[#dc2626]", className)}>
        <ChevronDown className={joinClasses("size-4", iconClassName)} aria-hidden />
        {Math.abs(change)}
      </span>
    );
  }

  return (
    <span className={joinClasses("inline-flex items-center gap-0.5 text-sm text-[#6a6a6a]", className)}>
      <Minus className={joinClasses("size-4", iconClassName)} aria-hidden />
      {zeroLabel}
    </span>
  );
}
