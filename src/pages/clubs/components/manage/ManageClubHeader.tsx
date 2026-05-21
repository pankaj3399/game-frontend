import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Calendar03Icon,
  CrownIcon,
  PlusSignIcon,
  ShieldIcon,
} from "@/icons/figma-icons";
import { Button } from "@/components/ui/button";
import type { AdminClub } from "@/pages/clubs/hooks";

interface ManageClubHeaderProps {
  clubId: string;
  selectedClub: AdminClub | null;
  showClubCrown: boolean;
  canUpdateExpiry: boolean;
  canAddStaff: boolean;
  showSponsorsButton?: boolean;
  onOpenExpiryModal: () => void;
  onOpenAddModal: () => void;
}

export function ManageClubHeader({
  clubId,
  selectedClub,
  showClubCrown,
  canUpdateExpiry,
  canAddStaff,
  showSponsorsButton = false,
  onOpenExpiryModal,
  onOpenAddModal,
}: ManageClubHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-5 flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
      <div className="min-w-0 flex-1 basis-0 sm:pr-2">
        <h1 className="flex min-w-0 items-center gap-2 text-lg font-semibold leading-tight text-[#010a04]">
          <span className="min-w-0 truncate" title={selectedClub?.name}>
            {selectedClub?.name}
          </span>
          {showClubCrown && (
            <CrownIcon size={18} className="shrink-0 text-[#ff8c00]" aria-hidden />
          )}
        </h1>
        <p className="mt-2 text-[14px] text-[#010a04]/60">{t("manageClub.manageAdminsSubtitle")}</p>
      </div>
      <div className="flex w-full min-w-0 shrink-0 flex-col gap-2 sm:w-auto sm:max-w-full sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
        {canUpdateExpiry && (
          <Button
            variant="outline"
            className="h-[30px] w-full shrink-0 whitespace-nowrap rounded-[8px] border-black/[0.12] px-[14px] text-[14px] font-medium sm:w-auto"
            onClick={onOpenExpiryModal}
          >
            <Calendar03Icon size={16} className="mr-1.5" />
            {t("manageClub.updateExpiry")}
          </Button>
        )}

        {showSponsorsButton && (
          <Button
            variant="outline"
            className="h-[30px] w-full shrink-0 whitespace-nowrap rounded-[8px] border-black/[0.12] px-[14px] text-[14px] font-medium sm:w-auto"
            asChild
          >
            <Link to={`/clubs/manage/sponsors/${clubId}`}>
              <ShieldIcon size={16} className="mr-1.5" />
              {t("manageClub.manageSponsors")}
            </Link>
          </Button>
        )}

        <Button
          variant="brand"
          size="sm"
          className="w-full shrink-0 whitespace-nowrap sm:w-auto"
          onClick={onOpenAddModal}
          disabled={!canAddStaff}
          title={!canAddStaff ? t("manageClub.addMemberDisabledHint") : undefined}
        >
          <PlusSignIcon size={16} className="mr-1.5 text-white" />
          {t("manageClub.addAdminOrganiser")}
        </Button>
      </div>
    </div>
  );
}
