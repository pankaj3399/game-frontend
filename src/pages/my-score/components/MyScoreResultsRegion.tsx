import type { ReactNode } from "react";
import InlineLoader from "@/components/shared/InlineLoader";
import { cn } from "@/lib/utils";

interface MyScoreResultsRegionProps {
  children: ReactNode;
  isRefreshing?: boolean;
}

export function MyScoreResultsRegion({
  children,
  isRefreshing = false,
}: MyScoreResultsRegionProps) {
  return (
    <div className="relative min-h-[120px]" aria-busy={isRefreshing} aria-live="polite">
      <div className={cn("transition-opacity", isRefreshing && "opacity-55")}>{children}</div>
      {isRefreshing ? (
        <div
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-white/35"
          aria-hidden
        >
          <InlineLoader className="border-[#010a04]/20 border-t-[#067429]" />
        </div>
      ) : null}
    </div>
  );
}
