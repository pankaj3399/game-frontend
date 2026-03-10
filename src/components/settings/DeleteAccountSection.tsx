import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/auth";
import { useDeleteAccount } from "@/hooks/user";
import { toast } from "sonner";
import InlineLoader from "@/components/shared/InlineLoader";

export function DeleteAccountSection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { deleteAccount, isLoading } = useDeleteAccount({
    onSuccess: async () => {
      setConfirmOpen(false);
      await logout();
      navigate("/login", { replace: true });
    },
  });

  const handleDeleteClick = async () => {
    const result = await deleteAccount();
    if (result.success) {
      toast.success(t("settings.deleteAccountSuccess"));
    } else {
      toast.error(result.message ?? t("settings.deleteAccountError"));
    }
  };

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-foreground">
            {t("settings.deleteAccount")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("settings.deleteAccountPlaceholder")}
          </p>
        </div>
        <Button
          type="button"
          variant="destructive"
          disabled={isLoading}
          onClick={() => setConfirmOpen(true)}
          className="shrink-0"
        >
          {isLoading ? (
            <>
              <InlineLoader size="sm" /> {t("settings.deleteAccountConfirm")}
            </>
          ) : (
            t("settings.deleteAccountConfirm")
          )}
        </Button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("settings.deleteAccountConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("settings.deleteAccountConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("settings.deleteAccountCancel")}</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={isLoading}
              onClick={handleDeleteClick}
            >
              {isLoading ? (
                <>
                  <InlineLoader size="sm" /> {t("settings.deleteAccountConfirm")}
                </>
              ) : (
                t("settings.deleteAccountConfirm")
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
