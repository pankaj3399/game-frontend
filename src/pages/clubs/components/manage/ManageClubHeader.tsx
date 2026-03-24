import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  CrownIcon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import type { AdminClub } from "@/pages/clubs/hooks";

interface ManageClubHeaderProps {
  selectedClub: AdminClub | null;
  showClubCrown: boolean;
  canUpdateExpiry: boolean;
  canAddStaff: boolean;
  onOpenExpiryModal: () => void;
  onOpenAddModal: () => void;
}

export function ManageClubHeader({
  selectedClub,
  showClubCrown,
  canUpdateExpiry,
  canAddStaff,
  onOpenExpiryModal,
  onOpenAddModal,
}: ManageClubHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-5 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="flex items-center gap-[10px] text-lg font-semibold leading-none text-[#010a04]">
          {selectedClub?.name}
          {showClubCrown && (
            <HugeiconsIcon
              icon={CrownIcon}
              size={18}
              className="text-[#ff8c00]"
              aria-hidden
            />
          )}
        </h1>
        <p className="mt-2 text-[14px] text-[#010a04]/60">{t("manageClub.manageAdminsSubtitle")}</p>
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
        {canUpdateExpiry && (
          <Button
            variant="outline"
            className="h-[30px] w-full rounded-[8px] border-black/[0.12] px-[14px] text-[14px] font-medium sm:w-auto sm:shrink-0"
            onClick={onOpenExpiryModal}
          >
            <HugeiconsIcon icon={Calendar03Icon} size={16} className="mr-1.5" />
            {t("manageClub.updateExpiry")}
          </Button>
        )}

        <Button
          className="h-[30px] w-full rounded-[8px] bg-brand-primary px-[14px] text-[14px] font-medium hover:bg-brand-primary-hover sm:w-auto sm:shrink-0"
          onClick={onOpenAddModal}
          disabled={!canAddStaff}
          title={!canAddStaff ? t("manageClub.addMemberDisabledHint") : undefined}
        >
          <HugeiconsIcon icon={PlusSignIcon} size={16} className="mr-1.5" />
          {t("manageClub.addAdminOrganiser")}
        </Button>
      </div>
    </div>
  );
}
