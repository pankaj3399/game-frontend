import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, CrownIcon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import type { AdminClub } from "@/pages/clubs/hooks";

interface ManageClubHeaderProps {
  selectedClub: AdminClub | null;
  canAddStaff: boolean;
  onBackToClubs: () => void;
  onOpenAddModal: () => void;
}

export function ManageClubHeader({
  selectedClub,
  canAddStaff,
  onBackToClubs,
  onOpenAddModal,
}: ManageClubHeaderProps) {
  const { t } = useTranslation();

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 -ml-2 lg:hidden"
        onClick={onBackToClubs}
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={16} className="mr-1" />
        {t("manageClub.backToClubs")}
      </Button>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold text-foreground">
            {selectedClub?.name}
            <HugeiconsIcon icon={CrownIcon} size={20} className="text-brand-primary" aria-hidden />
          </h1>
          <p className="text-sm text-muted-foreground">{t("manageClub.manageAdminsSubtitle")}</p>
        </div>
        <Button
          className="shrink-0 bg-brand-primary hover:bg-brand-primary-hover"
          onClick={onOpenAddModal}
          disabled={!canAddStaff}
          title={!canAddStaff ? t("manageClub.addMemberDisabledHint") : undefined}
        >
          <HugeiconsIcon icon={PlusSignIcon} size={16} className="mr-2" />
          {t("manageClub.addMember")}
        </Button>
      </div>
    </>
  );
}
