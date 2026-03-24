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
import {
  useAddClubStaff,
  type AddStaffRole,
} from "@/pages/clubs/hooks";
import { toast } from "sonner";
import { UserSearchSelect } from "@/components/shared/UserSearchSelect";
import { isAxiosError } from "axios";

// Adjust this type if you already have a shared User type
type User = {
  id: string;
  name?: string | null;
  alias?: string | null;
  email: string;
};

interface AddAdminOrganiserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubId: string;
  existingStaffIds: string[];
}

function parseAddStaffRole(value: string): AddStaffRole | null {
  if (value === "admin" || value === "organiser") {
    return value;
  }

  return null;
}

function extractApiErrorMessage(err: unknown): string | null {
  if (!isAxiosError(err)) {
    return null;
  }

  const message = err.response?.data?.message;
  return typeof message === "string" ? message : null;
}

export function AddAdminOrganiserModal({
  open,
  onOpenChange,
  clubId,
  existingStaffIds,
}: AddAdminOrganiserModalProps) {
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [role, setRole] = useState<AddStaffRole>("admin");

  const addStaff = useAddClubStaff();

  const isSelectedUserValid =
    selectedUser !== null &&
    !existingStaffIds.includes(selectedUser.id);

  const displayValue =
    isSelectedUserValid && selectedUser
      ? selectedUser.name?.trim() ||
        selectedUser.alias?.trim() ||
        selectedUser.email
      : searchQuery;

  const resetForm = () => {
    setSearchQuery("");
    setSelectedUser(null);
    setRole("admin");
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  };

  const handleAdd = async () => {
    if (!isSelectedUserValid || !selectedUser) {
      toast.error(t("manageClub.selectUserFirst"));
      return;
    }

    try {
      await addStaff.mutateAsync({
        clubId,
        userId: selectedUser.id,
        role,
      });

      toast.success(
        role === "admin"
          ? t("manageClub.addAdminSuccess")
          : t("manageClub.addOrganiserSuccess")
      );

      handleOpenChange(false);
    } catch (err: unknown) {
      const message = extractApiErrorMessage(err);

      toast.error(message ?? t("manageClub.addStaffError"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-[22px] rounded-[12px] border-black/10 px-[15px] py-5 shadow-[0px_3px_15px_0px_rgba(0,0,0,0.06)] sm:max-w-[416px]">
        <DialogHeader className="gap-[18px] pr-8">
          <DialogTitle className="text-[21px] font-semibold leading-none">
            {t("manageClub.addModalTitle")}
          </DialogTitle>
          <div className="h-px w-full bg-black/10" />
        </DialogHeader>

        <div className="space-y-[25px]">
          {/* User Search */}
          <div className="space-y-[10px]">
            <label
              htmlFor="search-user"
              className="block text-xs font-medium uppercase tracking-wider text-black/70"
            >
              {t("manageClub.searchUser")}
            </label>

            <UserSearchSelect
              inputId="search-user"
              value={displayValue}
              onValueChange={(value) => {
                setSearchQuery(value);
                setSelectedUser(null); // typing cancels selection
              }}
              openOnFocus={false}
              onSelectUser={(user) => {
                setSelectedUser(user);
                setSearchQuery(
                  user.name?.trim() ||
                    user.alias?.trim() ||
                    user.email
                );
              }}
              placeholder={t("manageClub.searchUserPlaceholder")}
              keepTypingText={t("manageClub.searchUserPlaceholder")}
              noResultsText={t("manageClub.noUsersFound")}
              userFilter={(user) =>
                !existingStaffIds.includes(user.id)
              }
              primaryText={(user) =>
                user.name?.trim() ||
                user.alias?.trim() ||
                user.email
              }
            />
          </div>

          {/* Role Select */}
          <div className="space-y-[10px]">
            <label
              htmlFor="role-select"
              className="block text-xs font-medium uppercase tracking-wider text-black/70"
            >
              {t("manageClub.role")}
            </label>

            <Select
              value={role}
              onValueChange={(value) => {
                const parsed = parseAddStaffRole(value);
                if (!parsed) return;
                setRole(parsed);
              }}
            >
              <SelectTrigger
                id="role-select"
                className="h-[38px] w-full rounded-[8px] border-[#e1e3e8] bg-[#f9fafc] text-[14px]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">
                  {t("manageClub.roleAdmin")}
                </SelectItem>
                <SelectItem value="organiser">
                  {t("manageClub.roleOrganiser")}
                </SelectItem>
              </SelectContent>
            </Select>

            <p className="text-[11px] text-black/60">
              {t("manageClub.roleHint")}
            </p>
          </div>

          {/* Submit */}
          <Button
            className="h-[38px] w-full rounded-[8px] bg-gradient-to-r from-[#0A6925] via-[#0C7B2C] to-[#0F8D33] text-[16px] font-medium text-white hover:from-[#095f22] hover:via-[#0b7228] hover:to-[#0d812f]"
            onClick={handleAdd}
            disabled={!isSelectedUserValid || addStaff.isPending}
          >
            {addStaff.isPending
              ? t("common.loading")
              : t("manageClub.addMember")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}