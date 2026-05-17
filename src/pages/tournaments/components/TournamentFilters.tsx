import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAllClubs, useClubById } from "@/pages/clubs/hooks";
import ListFilterIcon from "@/assets/icons/figma/misc/list-filter.svg?react";
import { Search01Icon } from "@/icons/figma-icons";

const FILTER_GREEN = "#006B2B";
const PILL_GREY = "#7a8078";

export interface TournamentFiltersChangePayload {
  when: string;
  distance: string;
  clubId?: string;
  clubScope?: "favorites";
}

interface TournamentFiltersProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: {
    when?: string;
    distance?: string;
    clubId?: string;
    clubScope?: "favorites";
  };
  onFiltersChange: (next: TournamentFiltersChangePayload) => void;
  /** Logged-in user's home club id (for Home club pill). */
  homeClubId?: string | null;
  /** Count of favourite clubs (Favourite clubs pill disabled when 0). */
  favoriteClubsCount?: number;
}

function PillRow({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string; disabled?: boolean }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-nowrap gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {options.map((opt) => {
        const active = !opt.disabled && value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            disabled={opt.disabled}
            onClick={() => {
              if (!opt.disabled) onChange(opt.value);
            }}
            className={[
              "shrink-0 rounded-full px-3.5 py-1.5 text-left text-[12.5px] font-medium transition-colors duration-150 select-none",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006B2B]/45",
              opt.disabled
                ? "cursor-not-allowed bg-black/10 text-white/50"
                : active
                  ? "text-white shadow-sm"
                  : "text-white",
            ].join(" ")}
            style={
              opt.disabled
                ? undefined
                : active
                  ? { backgroundColor: FILTER_GREEN }
                  : { backgroundColor: PILL_GREY }
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function SectionLabel({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p
      id={id}
      className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-black/40"
    >
      {children}
    </p>
  );
}

function normalizeDistanceForDraft(d?: string): string {
  if (d === "over80") return "all";
  return d ?? "all";
}

export function TournamentFilters({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  homeClubId = null,
  favoriteClubsCount = 0,
}: TournamentFiltersProps) {
  const { when, distance, clubId, clubScope } = filters;
  const { t } = useTranslation();
  const clubFilterLabelId = useId();
  const clubOptionIdPrefix = useId();
  const [clubSearch, setClubSearch] = useState("");
  const [clubSearchOpen, setClubSearchOpen] = useState(false);
  const [activeClubOptionIndex, setActiveClubOptionIndex] = useState(-1);
  const [draftWhen, setDraftWhen] = useState(when ?? "all");
  const [draftDistance, setDraftDistance] = useState(normalizeDistanceForDraft(distance));
  const [draftClubId, setDraftClubId] = useState<string | undefined>(clubId);
  const [draftClubScope, setDraftClubScope] = useState<"favorites" | undefined>(clubScope);
  const [selectedClubState, setSelectedClubState] = useState<{ id: string; name: string } | null>(null);
  const clubOptionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const { data: clubsData, isLoading: clubsLoading } = useAllClubs({
    page: 1,
    limit: 200,
    q: clubSearch.trim().length > 0 ? clubSearch : undefined,
    enabled: open || clubSearch.trim().length > 0,
  });

  const handlePopoverOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setDraftWhen(when ?? "all");
      setDraftDistance(normalizeDistanceForDraft(distance));
      setDraftClubId(clubScope === "favorites" ? undefined : clubId);
      setDraftClubScope(clubScope === "favorites" ? "favorites" : undefined);
      if (clubId && !clubScope && clubsData?.clubs) {
        const matchedClub = clubsData.clubs.find((c) => c.id === clubId);
        setSelectedClubState(matchedClub ? { id: matchedClub.id, name: matchedClub.name } : null);
      } else if (!clubId || clubScope === "favorites") {
        setSelectedClubState(null);
      }
      setClubSearch("");
      setClubSearchOpen(false);
      setActiveClubOptionIndex(-1);
    }
    if (!nextOpen) {
      setClubSearchOpen(false);
      setActiveClubOptionIndex(-1);
    }
    onOpenChange(nextOpen);
  };

  const clubs = clubsData?.clubs ?? [];
  const clubOptionCount = clubs.length + 1;
  const selectedClubFromState =
    draftClubId && selectedClubState?.id === draftClubId ? selectedClubState : null;
  const selectedClubFromList =
    draftClubId ? clubs.find((club) => club.id === draftClubId) ?? null : null;
  const shouldFetchSelectedClub =
    Boolean(draftClubId) &&
    !draftClubScope &&
    !selectedClubFromState &&
    !selectedClubFromList;
  const { data: selectedClubData, isLoading: selectedClubLoading } = useClubById(
    shouldFetchSelectedClub ? draftClubId ?? null : null,
  );
  const selectedClub =
    draftClubId
      ? selectedClubFromState ??
        selectedClubFromList ??
        (selectedClubData
          ? {
              id: selectedClubData.club.id,
              name: selectedClubData.club.name,
            }
          : null)
      : null;

  const appliedWhenIsActive = (when ?? "all") !== "all";
  const appliedDistanceIsActive = (distance ?? "all") !== "all" && distance !== "over80";
  const appliedClubIsActive = Boolean(clubId) || clubScope === "favorites";

  const activeFilterCount =
    (appliedWhenIsActive ? 1 : 0) +
    (appliedDistanceIsActive ? 1 : 0) +
    (appliedClubIsActive ? 1 : 0);

  const canClear = activeFilterCount > 0;

  const whenOptions = [
    { value: "future", label: t("tournaments.filterWhenFuture") },
    { value: "past", label: t("tournaments.filterWhenPast") },
    { value: "all", label: t("tournaments.filterWhenListAll") },
  ];

  const distanceOptions = [
    { value: "under50", label: t("tournaments.filterDistanceUnder50") },
    { value: "between50And80", label: t("tournaments.filterDistance50To80") },
    { value: "all", label: t("tournaments.filterDistanceAll") },
  ];

  const homePillDisabled = !homeClubId;
  const favoritesPillDisabled = favoriteClubsCount < 1;

  const clubPillValue =
    draftClubScope === "favorites"
      ? "favorites"
      : draftClubId && homeClubId && draftClubId === homeClubId
        ? "home"
        : !draftClubId && !draftClubScope
          ? "all"
          : "custom";

  const clubPillOptions = [
    { value: "home", label: t("tournaments.filterClubHome"), disabled: homePillDisabled },
    {
      value: "favorites",
      label: t("tournaments.filterClubFavorites"),
      disabled: favoritesPillDisabled,
    },
    { value: "all", label: t("tournaments.filterClubAllClubs") },
  ];

  const focusClubOptionByIndex = (index: number) => {
    const boundedIndex = Math.max(0, Math.min(index, clubOptionCount - 1));
    const option = clubOptionRefs.current[boundedIndex];
    if (!option) return;
    setActiveClubOptionIndex(boundedIndex);
    option.focus();
  };

  const handleClubListboxKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (clubOptionCount <= 0) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      const currentIndex =
        activeClubOptionIndex >= 0 ? activeClubOptionIndex : draftClubId ? clubs.findIndex((club) => club.id === draftClubId) + 1 : 0;
      const nextIndex = (currentIndex + direction + clubOptionCount) % clubOptionCount;
      focusClubOptionByIndex(nextIndex);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const optionIndex = activeClubOptionIndex >= 0 ? activeClubOptionIndex : 0;
      clubOptionRefs.current[optionIndex]?.click();
    }
  };

  return (
    <Popover open={open} onOpenChange={handlePopoverOpenChange}>
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

      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-[min(92vw,26rem)] overflow-visible rounded-2xl border border-black/[0.08] bg-white p-0 shadow-[0_8px_40px_-8px_rgba(0,0,0,0.18),0_2px_8px_-2px_rgba(0,0,0,0.06)]"
      >
        <div className="space-y-5 px-5 pb-6 pt-5">
          <div>
            <SectionLabel>{t("tournaments.filterWhen")}</SectionLabel>
            <PillRow options={whenOptions} value={draftWhen} onChange={setDraftWhen} />
          </div>

          <div>
            <SectionLabel>{t("tournaments.filterDistance")}</SectionLabel>
            <PillRow options={distanceOptions} value={draftDistance} onChange={setDraftDistance} />
          </div>

          <div>
            <SectionLabel id={clubFilterLabelId}>{t("tournaments.filterClub")}</SectionLabel>
            <PillRow
              options={clubPillOptions}
              value={clubPillValue === "custom" ? "" : clubPillValue}
              onChange={(v) => {
                if (v === "home" && homeClubId) {
                  setDraftClubScope(undefined);
                  setDraftClubId(homeClubId);
                  setSelectedClubState(null);
                  setClubSearch("");
                  setClubSearchOpen(false);
                } else if (v === "favorites") {
                  setDraftClubScope("favorites");
                  setDraftClubId(undefined);
                  setSelectedClubState(null);
                  setClubSearch("");
                  setClubSearchOpen(false);
                } else if (v === "all") {
                  setDraftClubScope(undefined);
                  setDraftClubId(undefined);
                  setSelectedClubState(null);
                  setClubSearch("");
                  setClubSearchOpen(false);
                }
              }}
            />

            {draftClubId && selectedClub && !draftClubScope ? (
              <div className="mt-3 flex items-center gap-1.5">
                <span className="inline-flex h-6 max-w-[16rem] items-center gap-1.5 truncate rounded-full bg-[#006B2B]/10 px-2.5 text-[11.5px] font-medium text-[#006B2B]">
                  <span className="block truncate">{selectedClub.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setDraftClubId(undefined);
                      setSelectedClubState(null);
                      setClubSearch("");
                    }}
                    className="shrink-0 leading-none text-[#006B2B]/60 hover:text-[#006B2B]"
                    aria-label={t("tournaments.removeClubFilter")}
                  >
                    ×
                  </button>
                </span>
              </div>
            ) : null}
            {draftClubId &&
            !selectedClub &&
            (clubsLoading || selectedClubLoading) &&
            !draftClubScope ? (
              <div className="mt-3 flex items-center gap-1.5">
                <span className="inline-flex h-6 max-w-[16rem] truncate rounded-full bg-[#006B2B]/10 px-2.5 text-[11.5px] font-medium text-[#006B2B]">
                  {t("common.loading")}
                </span>
              </div>
            ) : null}

            <div className="relative mt-3">
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
                  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                    e.preventDefault();
                    if (!clubSearchOpen) setClubSearchOpen(true);
                    const nextIndex = e.key === "ArrowUp" ? clubOptionCount - 1 : 0;
                    requestAnimationFrame(() => {
                      focusClubOptionByIndex(nextIndex);
                    });
                  }
                }}
                placeholder={t("tournaments.filterClubSearchPlaceholder")}
                className="h-9 rounded-xl border border-black/12 bg-black/[0.04] pl-9 text-sm text-foreground placeholder:text-black/35 focus:border-[#006B2B]/40 focus:bg-white focus:outline-none"
                aria-labelledby={clubFilterLabelId}
                autoComplete="off"
              />

              {clubSearchOpen && (
                <div
                  className="absolute left-0 right-0 top-[calc(100%+6px)] z-[70] overflow-hidden rounded-xl border border-black/[0.08] bg-white shadow-[0_8px_24px_-4px_rgba(0,0,0,0.14)]"
                  role="listbox"
                  aria-labelledby={clubFilterLabelId}
                  aria-activedescendant={activeClubOptionIndex >= 0 ? `${clubOptionIdPrefix}-option-${activeClubOptionIndex}` : undefined}
                  tabIndex={0}
                  onKeyDown={handleClubListboxKeyDown}
                >
                  <div className="max-h-52 overflow-y-auto">
                    <button
                      type="button"
                      className={[
                        "w-full border-b border-black/[0.06] px-3.5 py-2.5 text-left text-[13px] transition-colors",
                        !draftClubId && !draftClubScope
                          ? "bg-[#006B2B]/[0.07] font-semibold text-[#006B2B]"
                          : "text-foreground/60 hover:bg-black/[0.03] hover:text-foreground",
                      ].join(" ")}
                      onClick={() => {
                        setDraftClubId(undefined);
                        setDraftClubScope(undefined);
                        setSelectedClubState(null);
                        setClubSearchOpen(false);
                        setClubSearch("");
                        setActiveClubOptionIndex(0);
                      }}
                      role="option"
                      aria-selected={!draftClubId && !draftClubScope}
                      tabIndex={-1}
                      ref={(element) => {
                        clubOptionRefs.current[0] = element;
                      }}
                      onFocus={() => setActiveClubOptionIndex(0)}
                      id={`${clubOptionIdPrefix}-option-0`}
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
                      clubs.map((club, index) => (
                        <button
                          key={club.id}
                          type="button"
                          className={[
                            "w-full border-b border-black/[0.05] px-3.5 py-2.5 text-left text-[13px] transition-colors last:border-b-0",
                            club.id === draftClubId && !draftClubScope
                              ? "bg-[#006B2B]/[0.08] font-semibold text-[#006B2B]"
                              : "text-foreground hover:bg-black/[0.03]",
                          ].join(" ")}
                          onClick={() => {
                            setDraftClubId(club.id);
                            setDraftClubScope(undefined);
                            setSelectedClubState({ id: club.id, name: club.name });
                            setClubSearchOpen(false);
                            setClubSearch("");
                            setActiveClubOptionIndex(index + 1);
                          }}
                          title={club.name}
                          role="option"
                          aria-selected={club.id === draftClubId && !draftClubScope}
                          tabIndex={-1}
                          ref={(element) => {
                            clubOptionRefs.current[index + 1] = element;
                          }}
                          onFocus={() => {
                            setActiveClubOptionIndex(index + 1);
                          }}
                          id={`${clubOptionIdPrefix}-option-${index + 1}`}
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

        <div className="flex items-center gap-2.5 border-t border-black/[0.06] bg-black/[0.015] px-5 py-3.5">
          <Button
            variant="outline"
            size="sm"
            className="h-9 flex-1 rounded-xl border-black/15 bg-white text-[13px] font-medium text-black/45 hover:bg-black/[0.03] hover:text-black/60 disabled:opacity-50"
            disabled={!canClear}
            onClick={() => {
              setDraftWhen("all");
              setDraftDistance("all");
              setDraftClubId(undefined);
              setDraftClubScope(undefined);
              setSelectedClubState(null);
              setClubSearch("");
              setClubSearchOpen(false);
              setActiveClubOptionIndex(-1);
              onFiltersChange({
                when: "all",
                distance: "all",
                clubId: undefined,
                clubScope: undefined,
              });
              onOpenChange(false);
            }}
          >
            {t("timepicker.clear", { defaultValue: "Clear" })}
          </Button>
          <Button
            size="sm"
            className="h-9 flex-[2] rounded-xl text-[13px] font-semibold text-white shadow-sm transition-colors hover:opacity-95"
            style={{ backgroundColor: FILTER_GREEN }}
            onClick={() => {
              onFiltersChange({
                when: draftWhen,
                distance: draftDistance,
                clubId: draftClubScope === "favorites" ? undefined : draftClubId,
                clubScope: draftClubScope === "favorites" ? "favorites" : undefined,
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
