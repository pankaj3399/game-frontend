import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  onManageClubs: () => boolean;
  onRequiresHomeClub: () => void;
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
  onManageClubs,
  onRequiresHomeClub,
}: ClubsListHeaderProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
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
          onRequiresHomeClub={onRequiresHomeClub}
        />
        {canManage ? (
          <Button
            type="button"
            size="sm"
            className="h-9 shrink-0 rounded-[8px] border border-[rgba(1,10,4,0.12)] bg-brand-accent px-3 font-medium text-[#010a04] shadow-xs hover:bg-brand-accent-hover"
            onClick={() => {
              if (onManageClubs()) {
                navigate("/clubs/manage");
              }
            }}
          >
            {t("clubs.manageClubs")}
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
