import { useTranslation } from "react-i18next";
import { PlusSignIcon, PencilEdit01Icon, IconChevronLeft } from "@/icons/figma-icons";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { ROLES } from "@/constants/roles";
import { TournamentFilters } from "./TournamentFilters";
import { TournamentTab, type TournamentListTab } from "@/models/tournament";
interface TournamentActionsProps {
  activeTab: TournamentListTab;
  onTabChange: (tab: TournamentListTab) => void;
  filtersOpen: boolean;
  onFiltersOpenChange: (open: boolean) => void;
  when?: string;
  distance?: string;
  clubId?: string;
  onFiltersChange: (next: { when: string; distance: string; clubId?: string }) => void;
  onCreate: () => void;
}

export function TournamentActions({
  activeTab,
  onTabChange,
  filtersOpen,
  onFiltersOpenChange,
  when,
  distance,
  clubId,
  onFiltersChange,
  onCreate,
}: TournamentActionsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      <TournamentFilters
        open={filtersOpen}
        onOpenChange={onFiltersOpenChange}
        filters={{
          when,
          distance,
          clubId,
        }}
        onFiltersChange={onFiltersChange}
      />
      <RoleGuard requireRoleOrAbove={ROLES.ORGANISER}>
        {activeTab === TournamentTab.Published ? (
          <Button variant="outline" onClick={() => onTabChange(TournamentTab.Drafts)}>
            <PencilEdit01Icon size={16} className="mr-2" />
            {t("tournaments.tabDrafts")}
          </Button>
        ) : (
          <Button variant="outline" onClick={() => onTabChange(TournamentTab.Published)}>
            <IconChevronLeft size={16} className="mr-2" />
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
