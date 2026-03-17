import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { ROLES } from "@/constants/roles";
import { TournamentFilters } from "./TournamentFilters";

interface TournamentActionsProps {
  filtersOpen: boolean;
  onFiltersOpenChange: (open: boolean) => void;
  status?: string;
  canShowStatusFilter: boolean;
  onStatusChange: (value: string) => void;
  onCreate: () => void;
}

export function TournamentActions({
  filtersOpen,
  onFiltersOpenChange,
  status,
  canShowStatusFilter,
  onStatusChange,
  onCreate,
}: TournamentActionsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      <TournamentFilters
        open={filtersOpen}
        onOpenChange={onFiltersOpenChange}
        status={status}
        canShowStatusFilter={canShowStatusFilter}
        onStatusChange={onStatusChange}
      />
      <RoleGuard requireRoleOrAbove={ROLES.ORGANISER}>
        <Button className="bg-brand-primary hover:bg-brand-primary-hover" onClick={onCreate}>
          <HugeiconsIcon icon={PlusSignIcon} size={16} className="mr-2" />
          {t("tournaments.create")}
        </Button>
      </RoleGuard>
    </div>
  );
}
