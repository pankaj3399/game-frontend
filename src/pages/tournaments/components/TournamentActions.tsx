import { useTranslation } from "react-i18next";
import { PlusSignIcon } from "@/icons/figma-icons";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { ROLES } from "@/constants/roles";
import { TournamentFilters } from "./TournamentFilters";

interface TournamentActionsProps {
  filtersOpen: boolean;
  onFiltersOpenChange: (open: boolean) => void;
  query: string;
  status?: string;
  canShowStatusFilter: boolean;
  onQueryChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onCreate: () => void;
}

export function TournamentActions({
  filtersOpen,
  onFiltersOpenChange,
  query,
  status,
  canShowStatusFilter,
  onQueryChange,
  onStatusChange,
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
        canShowStatusFilter={canShowStatusFilter}
        onQueryChange={onQueryChange}
        onStatusChange={onStatusChange}
      />
      <RoleGuard requireRoleOrAbove={ROLES.ORGANISER}>
        <Button className="bg-brand-primary hover:bg-brand-primary-hover" onClick={onCreate}>
          <PlusSignIcon size={16} className="mr-2" />
          {t("tournaments.create")}
        </Button>
      </RoleGuard>
    </div>
  );
}
