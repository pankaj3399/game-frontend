import { Suspense, lazy, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TournamentFiltersChangePayload } from "./TournamentFilters";
import {
  TournamentFilterTrigger,
  countActiveTournamentFilters,
} from "./TournamentFilterTrigger";
import type { TournamentListTab } from "@/models/tournament";

const TournamentFilters = lazy(() =>
  import("./TournamentFilters").then((mod) => ({ default: mod.TournamentFilters })),
);

const OrganiserListButtons = lazy(() =>
  import("./OrganiserListButtons").then((mod) => ({
    default: mod.OrganiserListButtons,
  })),
);

interface TournamentActionsProps {
  activeTab: TournamentListTab;
  onTabChange: (tab: TournamentListTab) => void;
  filtersOpen: boolean;
  onFiltersOpenChange: (open: boolean) => void;
  when?: string;
  distance?: string;
  clubId?: string;
  clubScope?: "favorites";
  participation?: "joined" | "notJoined" | "organisedByMe";
  homeClubId?: string | null;
  favoriteClubsCount?: number;
  isAuthenticated?: boolean;
  onFiltersChange: (next: TournamentFiltersChangePayload) => void;
  onCreate: () => void;
  isApplyingFilters?: boolean;
  showOrganiserActions?: boolean;
}

export function TournamentActions({
  activeTab,
  onTabChange,
  filtersOpen,
  onFiltersOpenChange,
  when,
  distance,
  clubId,
  clubScope,
  participation,
  homeClubId,
  favoriteClubsCount,
  isAuthenticated,
  onFiltersChange,
  onCreate,
  isApplyingFilters = false,
  showOrganiserActions = false,
}: TournamentActionsProps) {
  const { t } = useTranslation();
  const [filtersMounted, setFiltersMounted] = useState(false);
  const showFilters = filtersMounted || filtersOpen;
  const activeFilterCount = countActiveTournamentFilters({
    when,
    distance:
      homeClubId && distance && distance !== "all" && distance !== "over80"
        ? distance
        : undefined,
    clubId,
    clubScope,
    participation,
  });

  const openFilters = () => {
    setFiltersMounted(true);
    onFiltersOpenChange(true);
  };

  return (
    <div className="flex w-full flex-wrap items-center justify-start gap-2 sm:w-auto sm:justify-end">
      {showFilters ? (
        <Suspense
          fallback={
            <TournamentFilterTrigger
              label={t("tournaments.filters")}
              activeFilterCount={activeFilterCount}
              open={filtersOpen}
              onOpen={openFilters}
            />
          }
        >
          <TournamentFilters
            open={filtersOpen}
            onOpenChange={onFiltersOpenChange}
            filters={{
              when,
              distance,
              clubId,
              clubScope,
              participation,
            }}
            homeClubId={homeClubId}
            favoriteClubsCount={favoriteClubsCount}
            isAuthenticated={isAuthenticated}
            onFiltersChange={onFiltersChange}
            isApplyingFilters={isApplyingFilters}
          />
        </Suspense>
      ) : (
        <TournamentFilterTrigger
          label={t("tournaments.filters")}
          activeFilterCount={activeFilterCount}
          open={false}
          onOpen={openFilters}
        />
      )}
      {showOrganiserActions ? (
        <Suspense fallback={null}>
          <OrganiserListButtons
            activeTab={activeTab}
            onTabChange={onTabChange}
            onCreate={onCreate}
          />
        </Suspense>
      ) : null}
    </div>
  );
}
