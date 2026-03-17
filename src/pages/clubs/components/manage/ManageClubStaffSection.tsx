import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import InlineLoader from "@/components/shared/InlineLoader";
import type { ClubStaffMember } from "@/pages/clubs/hooks";
import { StaffRow } from "./StaffRow";

interface ManageClubStaffSectionProps {
  staff: ClubStaffMember[];
  staffLoading: boolean;
  canAddStaff: boolean;
  onOpenAddModal: () => void;
}

export function ManageClubStaffSection({
  staff,
  staffLoading,
  canAddStaff,
  onOpenAddModal,
}: ManageClubStaffSectionProps) {
  const { t } = useTranslation();

  if (staffLoading) {
    return (
      <div className="flex justify-center py-12">
        <InlineLoader />
      </div>
    );
  }

  if (staff.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/20 py-12 text-center">
        <p className="text-muted-foreground">{t("manageClub.noStaff")}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={onOpenAddModal}
          disabled={!canAddStaff}
          title={!canAddStaff ? t("manageClub.addMemberDisabledHint") : undefined}
        >
          <HugeiconsIcon icon={PlusSignIcon} size={16} className="mr-2" />
          {t("manageClub.addMember")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {staff.map((member) => (
        <StaffRow
          key={member.id}
          member={member}
          onMenuAction={(action, id) => {
            console.log(action, id);
          }}
        />
      ))}
    </div>
  );
}
