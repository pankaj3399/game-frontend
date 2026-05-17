import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Settings01Icon } from "@/icons/figma-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import InlineLoader from "@/components/shared/InlineLoader";
import { ClubsListFiltersPopover } from "@/pages/clubs/components/list/ClubsListFiltersPopover";
import type { ClubListClubScope, ClubListDistanceFilter } from "@/pages/clubs/hooks/useClubsListFilters";

interface ClubsListHeaderProps {
  canManage: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  showSearchingHint?: boolean;
  appliedClubScope: ClubListClubScope;
  appliedDistance: ClubListDistanceFilter;
  onApplyFilters: (next: { clubScope: ClubListClubScope; distance: ClubListDistanceFilter }) => void;
  hasHomeClub: boolean;
}

export function ClubsListHeader({
  canManage,
  query,
  onQueryChange,
  showSearchingHint = false,
  appliedClubScope,
  appliedDistance,
  onApplyFilters,
  hasHomeClub,
}: ClubsListHeaderProps) {
  const { t } = useTranslation();
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="sr-only">{t("clubs.allClubs")}</h1>

      <div className="flex items-center justify-between gap-3">
        <ClubsListFiltersPopover
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
          appliedClubScope={appliedClubScope}
          appliedDistance={appliedDistance}
          onApply={onApplyFilters}
          hasHomeClub={hasHomeClub}
        />
        {canManage ? (
          <Button variant="outline" size="sm" className="h-9 shrink-0" asChild>
            <Link to="/clubs/manage">
              <Settings01Icon size={16} className="mr-2" />
              {t("clubs.manageClubs")}
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="relative w-full">
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={t("clubs.searchPlaceholder")}
          className={showSearchingHint ? "h-9 pr-9" : "h-9"}
          aria-busy={showSearchingHint}
        />
        {showSearchingHint && (
          <span
            className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          >
            <InlineLoader size="sm" />
          </span>
        )}
      </div>
    </div>
  );
}
