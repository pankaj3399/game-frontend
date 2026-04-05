import { ChevronDown, ChevronUp, Minus } from "@/icons/figma-icons";

interface PositionChangeIndicatorProps {
  change: number;
}

export function PositionChangeIndicator({ change }: PositionChangeIndicatorProps) {
  if (change > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-sm font-medium text-[#15803d]">
        <ChevronUp className="size-4" aria-hidden />
        {change}
      </span>
    );
  }

  if (change < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-sm font-medium text-[#dc2626]">
        <ChevronDown className="size-4" aria-hidden />
        {Math.abs(change)}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-0.5 text-sm text-[#9ca3af]">
      <Minus className="size-4" aria-hidden />
      0
    </span>
  );
}
