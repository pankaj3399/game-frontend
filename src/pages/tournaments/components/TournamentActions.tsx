import { Suspense, lazy } from "react";
import {
  TournamentFilters,
  type TournamentFiltersChangePayload,
} from "./TournamentFilters";
import type { TournamentListTab } from "@/models/tournament";

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
  return (
    <div className="flex w-full flex-wrap items-center justify-start gap-2 sm:w-auto sm:justify-end">
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
