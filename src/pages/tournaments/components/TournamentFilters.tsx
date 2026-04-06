import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAllClubs } from "@/pages/clubs/hooks";
import ListFilterIcon from "@/assets/icons/figma/misc/list-filter.svg?react";
import { Search01Icon } from "@/icons/figma-icons";

interface TournamentFiltersProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
  status?: string;
  when?: string;
  distance?: string;
  clubId?: string;
  onWhenChange: (value: string) => void;
  onDistanceChange: (value: string) => void;
  onClubChange: (clubId?: string) => void;
}

// Pill toggle group — replaces <Select> for When and Distance
function PillGroup({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={[
              "relative h-8 rounded-full px-3.5 text-[12.5px] font-medium transition-all duration-150 select-none",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/60",
              active
                ? "bg-brand-primary text-white shadow-sm shadow-brand-primary/30"
                : "bg-black/[0.045] text-foreground/70 hover:bg-black/[0.08] hover:text-foreground",
            ].join(" ")}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// Thin section label
function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-[10.5px] font-semibold uppercase tracking-widest text-black/35 mb-2">
      {children}
    </span>
  );
}

export function TournamentFilters({
  open,
  onOpenChange,
  query,
  status,
  when,
  distance,
  clubId,
  onWhenChange,
  onDistanceChange,
  onClubChange,
}: TournamentFiltersProps) {
  const { t } = useTranslation();
  const clubFilterLabelId = useId();
  const [clubSearch, setClubSearch] = useState("");
  const [clubSearchOpen, setClubSearchOpen] = useState(false);
  const [draftWhen, setDraftWhen] = useState(when ?? "all");
  const [draftDistance, setDraftDistance] = useState(distance ?? "all");
  const [draftClubId, setDraftClubId] = useState<string | undefined>(clubId);
  const [selectedClubState, setSelectedClubState] = useState<{ id: string; name: string } | null>(null);

  const handlePopoverOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setDraftWhen(when ?? "all");
      setDraftDistance(distance ?? "all");
      setDraftClubId(clubId);
      const matchedClub = clubId ? clubsData?.clubs?.find((c) => c.id === clubId) : null;
      setSelectedClubState(matchedClub ? { id: matchedClub.id, name: matchedClub.name } : null);
      setClubSearch("");
      setClubSearchOpen(false);
    }
    if (!nextOpen) setClubSearchOpen(false);
    onOpenChange(nextOpen);
  };

  const { data: clubsData, isLoading: clubsLoading } = useAllClubs({
    page: 1,
    limit: 200,
    q: clubSearch.trim().length > 0 ? clubSearch : undefined,
  });

  const clubs = clubsData?.clubs ?? [];
  const selectedClub =
    draftClubId
      ? (selectedClubState?.id === draftClubId
          ? selectedClubState
          : clubsData?.clubs?.find((c) => c.id === draftClubId)) ?? null
      : null;

const activeFilterCount =
  ((query ?? "").trim().length > 0 ? 1 : 0) +
  ((status ?? "all") !== "all" ? 1 : 0) +
  ((when ?? "all") !== "all" ? 1 : 0) +
  ((distance ?? "all") !== "all" ? 1 : 0) +
  (clubId ? 1 : 0);

  const hasDraftChanges =
    draftWhen !== (when ?? "all") ||
    draftDistance !== (distance ?? "all") ||
    draftClubId !== clubId;

  const whenOptions = [
    { value: "all", label: t("tournaments.filterWhenAll") },
    { value: "future", label: t("tournaments.filterWhenFuture") },
    { value: "past", label: t("tournaments.filterWhenPast") },
  ];

  const distanceOptions = [
    { value: "all", label: t("tournaments.filterDistanceAll") },
    { value: "under50", label: t("tournaments.filterDistanceUnder50") },
    { value: "between50And80", label: t("tournaments.filterDistance50To80") },
    { value: "over80", label: t("tournaments.filterDistanceOver80") },
  ];

  return (
    <Popover open={open} onOpenChange={handlePopoverOpenChange}>
      {/* ── Trigger ─────────────────────────────────────── */}
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={activeFilterCount > 0 ? "h-9 gap-2 border-brand-primary/40 text-brand-primary" : "h-9 gap-2"}
        >
          <ListFilterIcon width={14} height={14} aria-hidden className="shrink-0" />
          {t("tournaments.filters")}
          {activeFilterCount > 0 && (
            <span className="ml-0.5 inline-flex h-4.5 min-w-[1.125rem] items-center justify-center rounded-full bg-brand-primary px-1 text-[10px] font-bold leading-none text-white">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      {/* ── Panel ───────────────────────────────────────── */}
      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-[min(92vw,26rem)] overflow-visible rounded-2xl border border-black/[0.08] bg-white p-0 shadow-[0_8px_40px_-8px_rgba(0,0,0,0.18),0_2px_8px_-2px_rgba(0,0,0,0.06)]"
      >
        {/* Header */}
        <div className="px-5 pt-4 pb-3">
          <h4 className="text-[13.5px] font-semibold text-foreground tracking-[-0.01em]">
            {t("tournaments.filters")}
          </h4>
        </div>
        {/* Body */}
        <div className="space-y-5 p-5">
          {/* When */}
          <div>
            <FilterLabel>{t("tournaments.filterWhen")}</FilterLabel>
            <PillGroup
              options={whenOptions}
              value={draftWhen}
              onChange={setDraftWhen}
            />
          </div>

          {/* Distance */}
          <div>
            <FilterLabel>{t("tournaments.filterDistance")}</FilterLabel>
            <PillGroup
              options={distanceOptions}
              value={draftDistance}
              onChange={setDraftDistance}
            />
          </div>

          {/* Club search */}
          <div>
            <FilterLabel>{t("tournaments.filterClub")}</FilterLabel>

            {/* Selected club chip */}
            {draftClubId && selectedClub && (
              <div className="mb-2 flex items-center gap-1.5">
                <span className="inline-flex h-6 max-w-[16rem] items-center gap-1.5 truncate rounded-full bg-brand-primary/10 px-2.5 text-[11.5px] font-medium text-brand-primary">
                  <span className="block truncate">{selectedClub.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setDraftClubId(undefined);
                      setSelectedClubState(null);
                      setClubSearch("");
                    }}
                    className="shrink-0 leading-none text-brand-primary/60 hover:text-brand-primary"
                    aria-label="Remove club filter"
                  >
                    ×
                  </button>
                </span>
              </div>
            )}

            <div className="relative" id={clubFilterLabelId}>
              <Search01Icon
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/35"
              />
              <Input
                value={clubSearch}
                onChange={(e) => {
                  setClubSearch(e.target.value);
                  if (!clubSearchOpen) setClubSearchOpen(true);
                }}
                onFocus={() => {
                  if (!clubSearchOpen) setClubSearchOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setClubSearchOpen(false);
                }}
                placeholder={t("tournaments.filterClubSearchPlaceholder")}
                className="h-9 rounded-xl border-black/12 bg-black/[0.025] pl-9 text-sm placeholder:text-black/30 focus:bg-white focus:border-brand-primary/40 transition-colors"
                aria-labelledby={clubFilterLabelId}
                autoComplete="off"
                role="combobox"
                aria-expanded={clubSearchOpen}
              />

              {/* Dropdown */}
              {clubSearchOpen && (
                <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-[70] overflow-hidden rounded-xl border border-black/[0.08] bg-white shadow-[0_8px_24px_-4px_rgba(0,0,0,0.14)]">
                  <div className="max-h-52 overflow-y-auto">
                    {/* All clubs option */}
                    <button
                      type="button"
                      className={[
                        "w-full px-3.5 py-2.5 text-left text-[13px] transition-colors border-b border-black/[0.06]",
                        !draftClubId
                          ? "bg-brand-primary/[0.07] font-semibold text-brand-primary"
                          : "text-foreground/60 hover:bg-black/[0.03] hover:text-foreground",
                      ].join(" ")}
                      onClick={() => {
                        setDraftClubId(undefined);
                        setSelectedClubState(null);
                        setClubSearchOpen(false);
                        setClubSearch("");
                      }}
                    >
                      {t("tournaments.allClubs")}
                    </button>

                    {clubsLoading ? (
                      <div className="px-3.5 py-4 text-center text-xs text-black/35">
                        {t("common.loading")}
                      </div>
                    ) : clubs.length === 0 ? (
                      <div className="px-3.5 py-4 text-center text-xs text-black/35">
                        {t("tournaments.filterClubNoResults")}
                      </div>
                    ) : (
                      clubs.map((club) => (
                        <button
                          key={club.id}
                          type="button"
                          className={[
                            "w-full border-b border-black/[0.05] px-3.5 py-2.5 text-left text-[13px] transition-colors last:border-b-0",
                            club.id === draftClubId
                              ? "bg-brand-primary/[0.08] font-semibold text-brand-primary"
                              : "text-foreground hover:bg-black/[0.03]",
                          ].join(" ")}
                          onClick={() => {
                            setDraftClubId(club.id);
                            setSelectedClubState({ id: club.id, name: club.name });
                            setClubSearchOpen(false);
                            setClubSearch("");
                          }}
                          title={club.name}
                        >
                          <span className="block truncate">{club.name}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2.5 border-t border-black/[0.06] bg-black/[0.015] px-5 py-3.5">
          <Button
            variant="outline"
            size="sm"
            className="h-9 flex-1 rounded-xl border-black/12 bg-white text-[13px] font-medium text-foreground/70 hover:bg-black/[0.04] hover:text-foreground disabled:opacity-50"
            disabled={!hasDraftChanges}
            onClick={() => {
              setDraftWhen("all");
              setDraftDistance("all");
              setDraftClubId(undefined);
              setSelectedClubState(null);
              setClubSearch("");
              setClubSearchOpen(false);
            }}
          >
            {t("timepicker.clear", { defaultValue: "Clear" })}
          </Button>
          <Button
            size="sm"
            className="h-9 flex-[2] rounded-xl bg-brand-primary text-[13px] font-semibold text-white shadow-sm shadow-brand-primary/20 hover:bg-brand-primary-hover transition-colors"
            onClick={() => {
              onWhenChange(draftWhen);
              onDistanceChange(draftDistance);
              onClubChange(draftClubId);
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