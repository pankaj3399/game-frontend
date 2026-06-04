import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAllClubs, useClubById } from "@/pages/clubs/hooks";
import InlineLoader from "@/components/shared/InlineLoader";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ListFilterIcon from "@/assets/icons/figma/misc/list-filter.svg?react";
import { Search01Icon } from "@/icons/figma-icons";

const FILTER_GREEN = "#006B2B";
const PILL_GREY = "#7a8078";

export interface TournamentFiltersChangePayload {
  when: string;
  distance: string;
  clubId?: string;
  clubScope?: "favorites";
  participation?: "joined" | "notJoined" | "organisedByMe";
}

interface TournamentFiltersProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: {
    when?: string;
    distance?: string;
    clubId?: string;
    clubScope?: "favorites";
    participation?: "joined" | "notJoined" | "organisedByMe";
  };
  onFiltersChange: (next: TournamentFiltersChangePayload) => void;
  /** Logged-in user's home club id (for Home club pill). */
  homeClubId?: string | null;
  /** Count of favourite clubs (Favourite clubs pill disabled when 0). */
  favoriteClubsCount?: number;
  /** Whether the current user is authenticated (shows participation filter). */
  isAuthenticated?: boolean;
  /** True while the tournament list is refetching after filters were applied. */
  isApplyingFilters?: boolean;
}

function PillRow({
  options,
  value,
  onChange,
  onDisabledClick,
}: {
  options: {
    value: string;
    label: string;
    disabled?: boolean;
    disabledReason?: string;
  }[];
  value: string;
  onChange: (v: string) => void;
  onDisabledClick?: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = !opt.disabled && value === opt.value;
        const accessibleLabel =
          opt.disabled && opt.disabledReason
            ? `${opt.label}. ${opt.disabledReason}`
            : opt.label;

        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            aria-disabled={opt.disabled}
            aria-label={accessibleLabel}
            title={accessibleLabel}
            onClick={() => {
              if (opt.disabled) {
                onDisabledClick?.(opt.value);
                return;
              }
              onChange(opt.value);
            }}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-left text-[12.5px] font-medium transition-colors duration-150 select-none",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006B2B]/45",
              "text-white",
              opt.disabled
                ? "cursor-not-allowed border border-white/30 opacity-50"
                : active
                  ? "shadow-sm"
                  : undefined,
            )}
            style={{
              backgroundColor: !opt.disabled && active ? FILTER_GREEN : PILL_GREY,
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function SectionLabel({
  id,
  children,
  description,
}: {
  id?: string;
  children: ReactNode;
  description?: ReactNode;
}) {
  return (
    <div className="mb-2.5">
      <p
        id={id}
        className="text-[11px] font-semibold uppercase tracking-[0.06em] text-black/40"
      >
        {children}
      </p>
      {description ? (
        <p className="mt-1.5 text-[12px] font-normal leading-snug text-black/50 normal-case">
          {description}
        </p>
      ) : null}
    </div>
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
  isAuthenticated = false,
  isApplyingFilters = false,
}: TournamentFiltersProps) {
  const { when, distance, clubId, clubScope, participation } = filters;
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
  const [draftParticipation, setDraftParticipation] = useState<
    "joined" | "notJoined" | "organisedByMe" | "all"
  >(participation ?? "all");
  const [selectedClubState, setSelectedClubState] = useState<{ id: string; name: string } | null>(null);
  const clubOptionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const clubSearchComboboxRef = useRef<HTMLDivElement>(null);
  const hasHomeClub = Boolean(homeClubId);

  const { data: clubsData, isLoading: clubsLoading } = useAllClubs({
    page: 1,
    limit: 200,
    q: clubSearchOpen && clubSearch.trim().length > 0 ? clubSearch : undefined,
    enabled: open && clubSearchOpen,
  });

  const handlePopoverOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setDraftWhen(when ?? "all");
      setDraftDistance(
        hasHomeClub ? normalizeDistanceForDraft(distance) : "all",
      );
      setDraftClubId(clubScope === "favorites" ? undefined : clubId);
      setDraftClubScope(clubScope === "favorites" ? "favorites" : undefined);
      setDraftParticipation(participation ?? "all");
      if (clubId && !clubScope && clubsData?.clubs) {
        const matchedClub = clubsData.clubs.find((c) => c.id === clubId);
        if (matchedClub) {
          setSelectedClubState({ id: matchedClub.id, name: matchedClub.name });
          setClubSearch(matchedClub.name);
        } else {
          setSelectedClubState(null);
          setClubSearch("");
        }
      } else if (!clubId || clubScope === "favorites") {
        setSelectedClubState(null);
        setClubSearch("");
      }
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
  const clubOptionCount = clubs.length;
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
  const selectedClubName = selectedClub?.name;

  useEffect(() => {
    if (hasHomeClub || draftDistance === "all") return;
    setDraftDistance("all");
  }, [draftDistance, hasHomeClub]);

  useEffect(() => {
    if (!open || clubSearchOpen || draftClubScope || !draftClubId) return;
    if (selectedClubLoading) return;
    if (!selectedClubName) return;
    setClubSearch(selectedClubName);
  }, [
    open,
    clubSearchOpen,
    draftClubScope,
    draftClubId,
    selectedClubLoading,
    selectedClubName,
  ]);

  const appliedWhenIsActive = (when ?? "all") !== "all";
  const appliedDistanceIsActive =
    hasHomeClub && (distance ?? "all") !== "all" && distance !== "over80";
  const appliedClubIsActive = Boolean(clubId) || clubScope === "favorites";
  const appliedParticipationIsActive = Boolean(participation) && participation !== undefined;

  const activeFilterCount =
    (appliedWhenIsActive ? 1 : 0) +
    (appliedDistanceIsActive ? 1 : 0) +
    (appliedClubIsActive ? 1 : 0) +
    (appliedParticipationIsActive ? 1 : 0);

  const canClear = activeFilterCount > 0;

  const whenOptions = [
    { value: "future", label: t("tournaments.filterWhenFuture") },
    { value: "past", label: t("tournaments.filterWhenPast") },
    { value: "all", label: t("tournaments.filterWhenListAll") },
  ];

  const distanceDisabledReason = t("tournaments.filterDistanceRequiresHome");

  const distanceOptions = [
    {
      value: "under50",
      label: t("tournaments.filterDistanceUnder50"),
      disabled: !hasHomeClub,
      disabledReason: !hasHomeClub ? distanceDisabledReason : undefined,
    },
    {
      value: "between50And80",
      label: t("tournaments.filterDistance50To80"),
      disabled: !hasHomeClub,
      disabledReason: !hasHomeClub ? distanceDisabledReason : undefined,
    },
    { value: "all", label: t("tournaments.filterDistanceAll") },
  ];

  const homePillDisabled = !hasHomeClub;
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

  const handleFilterPanelPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (!clubSearchOpen) return;
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (clubSearchComboboxRef.current?.contains(target)) return;
    setClubSearchOpen(false);
    setActiveClubOptionIndex(-1);
  };

  const handleClubListboxKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (clubOptionCount <= 0) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      const currentIndex =
        activeClubOptionIndex >= 0
          ? activeClubOptionIndex
          : draftClubId
            ? Math.max(0, clubs.findIndex((club) => club.id === draftClubId))
            : 0;
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

  const hasChanges =
    draftWhen !== (when ?? "all") ||
    (hasHomeClub ? draftDistance : "all") !== normalizeDistanceForDraft(distance) ||
    (draftClubScope === "favorites"
      ? clubScope !== "favorites"
      : draftClubId !== (clubScope === "favorites" ? undefined : clubId)) ||
    draftParticipation !== (participation ?? "all");

  return (
    <Popover modal open={open} onOpenChange={handlePopoverOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-9 gap-2",
            activeFilterCount > 0 && "border-brand-primary/40 text-brand-primary",
          )}
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
        align="center"
        sideOffset={10}
        collisionPadding={16}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onPointerDown={handleFilterPanelPointerDown}
        className="flex w-[min(92vw,26rem)] max-h-[min(85dvh,calc(100dvh-2rem))] flex-col overflow-hidden rounded-2xl border border-black/[0.08] bg-white p-0 shadow-[0_8px_40px_-8px_rgba(0,0,0,0.18),0_2px_8px_-2px_rgba(0,0,0,0.06)]"
      >
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
          <div className="space-y-5 px-5 pb-4 pt-5">
          {isAuthenticated && (
            <div>
              <SectionLabel>{t("tournaments.filterParticipation")}</SectionLabel>
              <PillRow
                options={[
                  { value: "joined", label: t("tournaments.filterParticipationJoined") },
                  { value: "notJoined", label: t("tournaments.filterParticipationNotJoined") },
                  {
                    value: "organisedByMe",
                    label: t("tournaments.filterParticipationOrganisedByMe"),
                  },
                  { value: "all", label: t("tournaments.filterParticipationAll") },
                ]}
                value={draftParticipation}
                onChange={(v) =>
                  setDraftParticipation(
                    v as "joined" | "notJoined" | "organisedByMe" | "all",
                  )
                }
              />
            </div>
          )}

          <div className="min-w-0">
            <SectionLabel id={clubFilterLabelId}>{t("tournaments.filterClub")}</SectionLabel>

            <div ref={clubSearchComboboxRef} className="relative">
              <Search01Icon
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/35"
              />
              <Input
                value={
                  draftClubId &&
                  !draftClubScope &&
                  !selectedClub &&
                  (clubsLoading || selectedClubLoading)
                    ? t("common.loading")
                    : clubSearch
                }
                onChange={(e) => {
                  const next = e.target.value;
                  setClubSearch(next);
                  if (!clubSearchOpen) setClubSearchOpen(true);
                  if (
                    draftClubId &&
                    !draftClubScope &&
                    selectedClub &&
                    next !== selectedClub.name
                  ) {
                    setDraftClubId(undefined);
                    setSelectedClubState(null);
                  }
                }}
                onFocus={() => {
                  if (!clubSearchOpen) setClubSearchOpen(true);
                }}
                onClick={() => {
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
                  className="mt-1.5 overflow-hidden rounded-xl border border-black/[0.08] bg-white shadow-[0_8px_24px_-4px_rgba(0,0,0,0.14)]"
                  role="listbox"
                  aria-labelledby={clubFilterLabelId}
                  aria-activedescendant={activeClubOptionIndex >= 0 ? `${clubOptionIdPrefix}-option-${activeClubOptionIndex}` : undefined}
                  tabIndex={0}
                  onKeyDown={handleClubListboxKeyDown}
                >
                  <div className="max-h-52 overflow-y-auto">
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
                            setClubSearch(club.name);
                            setActiveClubOptionIndex(index);
                          }}
                          title={club.name}
                          role="option"
                          aria-selected={club.id === draftClubId && !draftClubScope}
                          tabIndex={-1}
                          ref={(element) => {
                            clubOptionRefs.current[index] = element;
                          }}
                          onFocus={() => {
                            setActiveClubOptionIndex(index);
                          }}
                          id={`${clubOptionIdPrefix}-option-${index}`}
                        >
                          <span className="block truncate">{club.name}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-3">
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
            </div>

          </div>

          <div>
            <SectionLabel>{t("tournaments.filterWhen")}</SectionLabel>
            <PillRow options={whenOptions} value={draftWhen} onChange={setDraftWhen} />
          </div>

          <div>
            <SectionLabel>{t("tournaments.filterDistance")}</SectionLabel>
            <PillRow
              options={distanceOptions}
              value={hasHomeClub ? draftDistance : "all"}
              onChange={setDraftDistance}
              onDisabledClick={() => {
                toast.info(t("tournaments.filterDistanceRequiresHome"));
              }}
            />
          </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2.5 border-t border-black/[0.06] bg-black/[0.015] px-5 py-3.5">
          <Button
            variant="outline"
            size="sm"
            className="h-9 flex-1 rounded-xl border-black/15 bg-white text-[13px] font-medium text-black/45 hover:bg-black/[0.03] hover:text-black/60 disabled:opacity-50"
            disabled={!canClear || isApplyingFilters}
            onClick={() => {
              setDraftWhen("all");
              setDraftDistance("all");
              setDraftClubId(undefined);
              setDraftClubScope(undefined);
              setDraftParticipation("all");
              setSelectedClubState(null);
              setClubSearch("");
              setClubSearchOpen(false);
              setActiveClubOptionIndex(-1);
              onFiltersChange({
                when: "all",
                distance: "all",
                clubId: undefined,
                clubScope: undefined,
                participation: undefined,
              });
              onOpenChange(false);
            }}
          >
            {t("timepicker.clear", { defaultValue: "Clear" })}
          </Button>
          <Button
            size="sm"
            disabled={isApplyingFilters || !hasChanges}
            aria-busy={isApplyingFilters}
            className="h-9 flex-[2] rounded-xl text-[13px] font-semibold text-white shadow-sm transition-colors hover:opacity-95 disabled:opacity-80"
            style={{ backgroundColor: FILTER_GREEN }}
            onClick={() => {
              onFiltersChange({
                when: draftWhen,
                distance: hasHomeClub ? draftDistance : "all",
                clubId: draftClubScope === "favorites" ? undefined : draftClubId,
                clubScope: draftClubScope === "favorites" ? "favorites" : undefined,
                participation:
                  draftParticipation === "all"
                    ? undefined
                    : draftParticipation,
              });
              onOpenChange(false);
            }}
          >
            {isApplyingFilters ? (
              <InlineLoader size="sm" className="border-white/35 border-t-white" />
            ) : null}
            {isApplyingFilters
              ? t("tournaments.filterApplying")
              : t("tournaments.applyFilters")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
