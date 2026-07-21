import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ListFilterIcon from "@/assets/icons/figma/misc/list-filter.svg?react";

type TournamentFilterTriggerProps = {
  label: string;
  activeFilterCount: number;
  open?: boolean;
  sheetControlsId?: string;
  /** bottom-sheet uses dialog ARIA; popover trigger is wrapped by Radix. */
  variant?: "popover" | "bottom-sheet";
  onOpen?: () => void;
  className?: string;
};

export function countActiveTournamentFilters(filters: {
  when?: string;
  distance?: string;
  clubId?: string;
  clubScope?: string;
  participation?: string;
}): number {
  return [
    filters.when && filters.when !== "all",
    filters.distance && filters.distance !== "all",
    Boolean(filters.clubId),
    filters.clubScope === "favorites",
    Boolean(filters.participation),
  ].filter(Boolean).length;
}

export function TournamentFilterTrigger({
  label,
  activeFilterCount,
  open = false,
  sheetControlsId,
  variant = "bottom-sheet",
  onOpen,
  className,
}: TournamentFilterTriggerProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      type="button"
      className={cn(
        "h-9 gap-2",
        activeFilterCount > 0 && "border-brand-primary/40 text-brand-primary",
        className,
      )}
      {...(variant === "bottom-sheet"
        ? {
            "aria-haspopup": "dialog" as const,
            "aria-expanded": open,
            ...(sheetControlsId ? { "aria-controls": sheetControlsId } : {}),
          }
        : {})}
      onClick={variant === "bottom-sheet" ? onOpen : undefined}
    >
      <ListFilterIcon width={14} height={14} aria-hidden className="shrink-0" />
      {label}
      {activeFilterCount > 0 && (
        <span className="ml-0.5 inline-flex h-4.5 min-w-[1.125rem] items-center justify-center rounded-full bg-brand-primary px-1 text-[10px] font-bold leading-none text-white">
          {activeFilterCount}
        </span>
      )}
    </Button>
  );
}
