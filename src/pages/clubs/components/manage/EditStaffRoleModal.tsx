import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  ClubStaffMember,
  EditableClubStaffRole,
} from "@/pages/clubs/hooks";

interface EditStaffRoleModalProps {
  open: boolean;
  member: ClubStaffMember | null;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (role: EditableClubStaffRole) => Promise<void> | void;
}

function toEditableRole(member: ClubStaffMember | null): EditableClubStaffRole {
  if (!member) {
    return "organiser";
  }

  return member.role === "admin" ? "admin" : "organiser";
}

function parseEditableRole(value: string): EditableClubStaffRole | null {
  if (value === "admin" || value === "organiser") {
    return value;
  }

  return null;
}

export function EditStaffRoleModal({
  open,
  member,
  isSubmitting,
  onOpenChange,
  onConfirm,
}: EditStaffRoleModalProps) {
  const { t } = useTranslation();
  const [role, setRole] = useState<EditableClubStaffRole>(() => toEditableRole(member));

  const currentRole = toEditableRole(member);

  function handleOpenChange(nextOpen: boolean) {
    if (isSubmitting) {
      return;
    }

    if (!nextOpen) {
      setRole(toEditableRole(member));
    }

    onOpenChange(nextOpen);
  }

  async function handleConfirm() {
    await onConfirm(role);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="w-[424px] max-w-[calc(100%-2rem)] gap-0 rounded-[12px] border border-[rgba(1,10,4,0.08)] p-[20px_15px] shadow-[0px_3px_15px_0px_rgba(0,0,0,0.06)]"
      >
        <DialogHeader className="gap-[18px]">
          <DialogTitle className="pr-10 text-[21px] font-semibold leading-none text-[#010a04]">
            {t("manageClub.editRoleModalTitle")}
          </DialogTitle>
          <div className="h-px w-full bg-black/10" />
        </DialogHeader>

      
        <div className="mt-[22px] space-y-[22px]">
       
          <div className="rounded-[10px] border border-[#e5e7eb] bg-[#fafbfc] p-[12px]">
            <div className="space-y-[10px]">
            <label
              htmlFor="staff-role-select"
              className="block text-xs font-medium uppercase tracking-wider text-black/70"
            >
              {t("manageClub.role")}
            </label>
            <Select
              value={role}
              onValueChange={(value) => {
                const parsed = parseEditableRole(value);
                if (!parsed) return;
                setRole(parsed);
              }}
            >
              <SelectTrigger
                id="staff-role-select"
                className="h-[40px] w-full rounded-[8px] border-[#e1e3e8] bg-white text-[14px]"
              >
                <SelectValue placeholder={t("selectOption")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">{t("manageClub.roleAdmin")}</SelectItem>
                <SelectItem value="organiser">
                  {t("manageClub.roleOrganiser")}
                </SelectItem>
              </SelectContent>
            </Select>

            <p className="text-[11px] text-black/60">{t("manageClub.roleHint")}</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-[12px]">
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
              className="h-[38px] flex-1 rounded-[8px] border border-[rgba(0,0,0,0.15)] bg-white text-[16px] font-medium text-[#010a04] shadow-none hover:bg-white"
            >
              {t("settings.adminClubsCancel")}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isSubmitting || role === currentRole}
              className="h-[38px] flex-1 rounded-[8px] bg-linear-to-r from-[#0a6925] via-[#0c7b2c] to-[#0f8d33] text-[16px] font-medium text-white hover:opacity-95"
            >
              {isSubmitting
                ? t("common.loading")
                : t("manageClub.editRoleModalConfirm")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
