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
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } })
              .response?.data?.message
          : null;

      toast.error(message ?? t("manageClub.addStaffError"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("manageClub.addModalTitle")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Search */}
          <div>
            <label
              htmlFor="search-user"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground"
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
          <div>
            <label
              htmlFor="role-select"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              {t("manageClub.role")}
            </label>

            <Select
              value={role}
              onValueChange={(value) =>
                setRole(value as AddStaffRole)
              }
            >
              <SelectTrigger id="role-select" className="w-full">
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

            <p className="mt-1 text-xs text-muted-foreground">
              {t("manageClub.roleHint")}
            </p>
          </div>

          {/* Submit */}
          <Button
            className="w-full bg-brand-primary hover:bg-brand-primary-hover"
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