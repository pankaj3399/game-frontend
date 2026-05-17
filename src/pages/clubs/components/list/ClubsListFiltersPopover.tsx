import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import ListFilterIcon from "@/assets/icons/figma/misc/list-filter.svg?react";
import type { ClubListClubScope, ClubListDistanceFilter } from "@/pages/clubs/hooks/useClubsListFilters";

interface ClubsListFiltersPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appliedClubScope: ClubListClubScope;
  appliedDistance: ClubListDistanceFilter;
  onApply: (next: { clubScope: ClubListClubScope; distance: ClubListDistanceFilter }) => void;
  hasHomeClub: boolean;
}

function ScopePillGroup({
  options,
  value,
  onChange,
}: {
  options: { value: ClubListClubScope; label: string }[];
  value: ClubListClubScope;
  onChange: (v: ClubListClubScope) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className={[
              "relative h-8 select-none rounded-full px-3.5 text-[12.5px] font-medium transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/60",
              active
                ? "bg-brand-primary text-white shadow-sm shadow-brand-primary/30"
                : "bg-[#9CA3AF] text-white hover:bg-[#8B9099]",
            ].join(" ")}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function DistancePillGroup({
  options,
  value,
  onChange,
  disabled,
}: {
  options: { value: ClubListDistanceFilter; label: string }[];
  value: ClubListDistanceFilter;
  onChange: (v: ClubListDistanceFilter) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = value === opt.value;
        const optionDisabled = disabled && opt.value !== "all";
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            aria-disabled={optionDisabled}
            disabled={optionDisabled}
            onClick={() => onChange(opt.value)}
            className={[
              "relative h-8 select-none rounded-full px-3.5 text-[12.5px] font-medium transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/60",
              active
                ? "bg-brand-primary text-white shadow-sm shadow-brand-primary/30"
                : "bg-[#9CA3AF] text-white hover:bg-[#8B9099]",
              optionDisabled ? "cursor-not-allowed opacity-45" : "",
            ].join(" ")}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function ClubsListFiltersPopover({
  open,
  onOpenChange,
  appliedClubScope,
  appliedDistance,
  onApply,
  hasHomeClub,
}: ClubsListFiltersPopoverProps) {
  const { t } = useTranslation();
  const [draftScope, setDraftScope] = useState(appliedClubScope);
  const [draftDistance, setDraftDistance] = useState(appliedDistance);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setDraftScope(appliedClubScope);
      setDraftDistance(hasHomeClub ? appliedDistance : "all");
    }
    onOpenChange(nextOpen);
  };

  const activeFilterCount =
    (appliedClubScope !== "all" ? 1 : 0) +
    (hasHomeClub && appliedDistance !== "all" ? 1 : 0);

  const scopeOptions: { value: ClubListClubScope; label: string }[] = [
    { value: "home", label: t("clubs.filterScopeHome") },
    { value: "favorites", label: t("clubs.filterScopeFavorites") },
    { value: "all", label: t("clubs.filterScopeAll") },
  ];

  const distanceOptions: { value: ClubListDistanceFilter; label: string }[] = [
    { value: "under50", label: t("clubs.filterDistanceUnder50") },
    { value: "between50And80", label: t("clubs.filterDistance50To80") },
    { value: "all", label: t("clubs.filterDistanceAll") },
  ];

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={
            activeFilterCount > 0
              ? "h-9 gap-2 rounded-full border-black/10 bg-white shadow-sm border-brand-primary/40 text-brand-primary"
              : "h-9 gap-2 rounded-full border-black/10 bg-white shadow-sm"
          }
        >
          <ListFilterIcon width={14} height={14} aria-hidden className="shrink-0" />
          {t("clubs.filters")}
          {activeFilterCount > 0 && (
            <span className="ml-0.5 inline-flex h-4.5 min-w-[1.125rem] items-center justify-center rounded-full bg-brand-primary px-1 text-[10px] font-bold leading-none text-white">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={10}
        className="w-[min(92vw,26rem)] overflow-visible rounded-2xl border border-black/[0.08] bg-white p-0 shadow-[0_8px_40px_-8px_rgba(0,0,0,0.18),0_2px_8px_-2px_rgba(0,0,0,0.06)]"
      >
        <div className="px-5 pt-6 pb-2">
          <h4 className="text-xl font-bold text-foreground">{t("clubs.filters")}</h4>
        </div>

        <div className="space-y-6 px-5 pb-6 pt-2">
          <div>
            <ScopePillGroup options={scopeOptions} value={draftScope} onChange={setDraftScope} />
          </div>
          <div>
            {!hasHomeClub && (
              <p className="mb-2 text-xs text-muted-foreground">{t("clubs.filterDistanceRequiresHome")}</p>
            )}
            <DistancePillGroup
              options={distanceOptions}
              value={draftDistance}
              onChange={setDraftDistance}
              disabled={!hasHomeClub}
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5 border-t border-black/[0.06] bg-black/[0.015] px-5 py-3.5">
          <Button
            variant="outline"
            size="sm"
            className="h-9 flex-1 rounded-xl border-black/12 bg-white text-[13px] font-medium text-foreground/70 hover:bg-black/[0.04] hover:text-foreground disabled:opacity-50"
            disabled={appliedClubScope === "all" && appliedDistance === "all"}
            onClick={() => {
              setDraftScope("all");
              setDraftDistance("all");
              onApply({ clubScope: "all", distance: "all" });
              onOpenChange(false);
            }}
          >
            {t("timepicker.clear", { defaultValue: "Clear" })}
          </Button>
          <Button
            size="sm"
            className="h-9 flex-[2] rounded-xl bg-brand-primary text-[13px] font-semibold text-white shadow-sm shadow-brand-primary/20 transition-colors hover:bg-brand-primary-hover"
            onClick={() => {
              onApply({
                clubScope: draftScope,
                distance: hasHomeClub ? draftDistance : "all",
              });
              onOpenChange(false);
            }}
          >
            {t("tournaments.applyFilters")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
