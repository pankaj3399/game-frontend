import { useTranslation } from "react-i18next";
import { PlusSignIcon, PencilEdit01Icon, IconChevronLeft } from "@/icons/figma-icons";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { ROLES } from "@/constants/roles";
import { TournamentFilters, type TournamentFiltersChangePayload } from "./TournamentFilters";
import { TournamentTab, type TournamentListTab } from "@/models/tournament";
interface TournamentActionsProps {
  activeTab: TournamentListTab;
  onTabChange: (tab: TournamentListTab) => void;
  filtersOpen: boolean;
  onFiltersOpenChange: (open: boolean) => void;
  when?: string;
  distance?: string;
  clubId?: string;
  clubScope?: "favorites";
  participation?: "joined" | "notJoined";
  homeClubId?: string | null;
  favoriteClubsCount?: number;
  isAuthenticated?: boolean;
  onFiltersChange: (next: TournamentFiltersChangePayload) => void;
  onCreate: () => void;
  isApplyingFilters?: boolean;
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
}: TournamentActionsProps) {
  const { t } = useTranslation();

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
      <RoleGuard requireRoleOrAbove={ROLES.ORGANISER}>
        {activeTab === TournamentTab.Published ? (
          <Button
            variant="outline"
            className="h-9 min-w-0 flex-1 sm:flex-none"
            onClick={() => onTabChange(TournamentTab.Drafts)}
          >
            <PencilEdit01Icon size={16} className="mr-2 shrink-0" />
            <span className="truncate">{t("tournaments.tabDrafts")}</span>
          </Button>
        ) : (
          <Button
            variant="outline"
            className="h-9 min-w-0 flex-1 sm:flex-none"
            onClick={() => onTabChange(TournamentTab.Published)}
          >
            <IconChevronLeft size={16} className="mr-2 shrink-0" />
            <span className="truncate">{t("tournaments.tabPublished")}</span>
          </Button>
        )}
        <Button
          variant="brand"
          size="sm"
          className="min-w-0 flex-1 sm:flex-none"
          onClick={onCreate}
        >
          <PlusSignIcon size={16} className="mr-2 shrink-0 text-white" />
          <span className="truncate">{t("tournaments.create")}</span>
        </Button>
      </RoleGuard>
    </div>
  );
}
