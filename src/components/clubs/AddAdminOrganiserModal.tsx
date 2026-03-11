import { useState } from "react";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSearchUsers, isUserSearchQueryValid } from "@/hooks/user";
import { useAddClubStaff, type AddStaffRole } from "@/hooks/club";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import InlineLoader from "@/components/shared/InlineLoader";

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
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [role, setRole] = useState<AddStaffRole>("admin");

  const { data: searchData, isLoading: searchLoading } = useSearchUsers(
    searchQuery,
    open && isUserSearchQueryValid(searchQuery)
  );
  const addStaff = useAddClubStaff();

  const users = searchData?.users ?? [];
  const filteredUsers = users.filter((u) => !existingStaffIds.includes(u.id));

  const resetForm = () => {
    setSearchQuery("");
    setSelectedUserId(null);
    setRole("admin");
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  };

  const handleAdd = async () => {
    if (!selectedUserId) {
      toast.error(t("manageClub.selectUserFirst"));
      return;
    }
    if (
      existingStaffIds.includes(selectedUserId) ||
      !filteredUsers.some((u) => u.id === selectedUserId)
    ) {
      toast.error(t("manageClub.userNoLongerEligible"));
      return;
    }

    try {
      await addStaff.mutateAsync({ clubId, userId: selectedUserId, role });
      toast.success(
        role === "admin"
          ? t("manageClub.addAdminSuccess")
          : t("manageClub.addOrganiserSuccess")
      );
      handleOpenChange(false);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : null;
      toast.error(msg ?? t("manageClub.addStaffError"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("manageClub.addModalTitle")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="search-user"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              {t("manageClub.searchUser")}
            </label>
            <div className="relative">
              <HugeiconsIcon icon={Search01Icon} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="search-user"
                type="text"
                placeholder={t("manageClub.searchUserPlaceholder")}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedUserId(null);
                }}
                className="pl-9"
                autoComplete="off"
              />
            </div>
            {isUserSearchQueryValid(searchQuery) && (
              <div className="mt-2 max-h-40 overflow-y-auto rounded-md border border-border bg-muted/30">
                {searchLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <InlineLoader className="h-5 w-5" size="sm" />
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                    {t("manageClub.noUsersFound")}
                  </p>
                ) : (
                  <ul className="py-1">
                    {filteredUsers.map((u) => {
                      const isSelected = selectedUserId === u.id;
                      const display =
                        u.name?.trim() || u.alias?.trim() || u.email;
                      return (
                        <li key={u.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedUserId(u.id)}
                            className={cn(
                              "w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50",
                              isSelected && "bg-muted"
                            )}
                          >
                            <span className="font-medium">{display}</span>
                            <span className="ml-2 text-muted-foreground">
                              {u.email}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="role-select"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              {t("manageClub.role")}
            </label>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as AddStaffRole)}
            >
              <SelectTrigger id="role-select" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">{t("manageClub.roleAdmin")}</SelectItem>
                <SelectItem value="organiser">
                  {t("manageClub.roleOrganiser")}
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("manageClub.roleHint")}
            </p>
          </div>

          <Button
            className="w-full bg-brand-primary hover:bg-brand-primary-hover"
            onClick={handleAdd}
            disabled={
              !selectedUserId ||
              addStaff.isPending ||
              existingStaffIds.includes(selectedUserId) ||
              !filteredUsers.some((u) => u.id === selectedUserId)
            }
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
