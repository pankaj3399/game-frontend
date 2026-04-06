import { useTranslation } from "react-i18next";
import { PlusSignIcon, PencilEdit01Icon, IconChevronLeft } from "@/icons/figma-icons";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { ROLES } from "@/constants/roles";
import { TournamentFilters } from "./TournamentFilters";
import type { TournamentListTab } from "@/models/tournament";

interface TournamentActionsProps {
  activeTab: TournamentListTab;
  onTabChange: (tab: TournamentListTab) => void;
  filtersOpen: boolean;
  onFiltersOpenChange: (open: boolean) => void;
  query: string;
  status?: string;
  when?: string;
  distance?: string;
  clubId?: string;
  canShowStatusFilter: boolean;
  onWhenChange: (value: string) => void;
  onDistanceChange: (value: string) => void;
  onClubChange: (clubId?: string) => void;
  onCreate: () => void;
}

export function TournamentActions({
  activeTab,
  onTabChange,
  filtersOpen,
  onFiltersOpenChange,
  query,
  status,
  when,
  distance,
  clubId,
  onWhenChange,
  onDistanceChange,
  onClubChange,
  onCreate,
}: TournamentActionsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      <TournamentFilters
        open={filtersOpen}
        onOpenChange={onFiltersOpenChange}
        query={query}
        status={status}
        when={when}
        distance={distance}
        clubId={clubId}
        onWhenChange={onWhenChange}
        onDistanceChange={onDistanceChange}
        onClubChange={onClubChange}
      />
      <RoleGuard requireRoleOrAbove={ROLES.ORGANISER}>
        {activeTab === "published" ? (
          <Button variant="outline" onClick={() => onTabChange("drafts")}>
            <PencilEdit01Icon size={16} className="mr-2" />
            {t("tournaments.tabDrafts")}
          </Button>
        ) : (
          <Button variant="outline" onClick={() => onTabChange("published")}>
            <IconChevronLeft size={16} className="mr-1" />
            {t("tournaments.tabPublished")}
          </Button>
        )}
        <Button className="bg-brand-primary text-white hover:bg-brand-primary-hover" onClick={onCreate}>
          <PlusSignIcon size={16} className="mr-2 text-white" />
          {t("tournaments.create")}
        </Button>
      </RoleGuard>
    </div>
  );
}
