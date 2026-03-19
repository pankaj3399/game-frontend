import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { usePromoteToSuperAdmin } from "@/pages/admin/hooks";
import { Input } from "@/components/ui/input";
import { UserSearchSelect } from "@/components/shared/UserSearchSelect";

export default function PromoteSuperAdminPage() {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const trimmedUsername = username.trim();
  const promote = usePromoteToSuperAdmin();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!trimmedUsername) {
      toast.error(t("admin.promoteSuperAdmin.toastUsernameRequired"));
      return;
    }

    if (!password.trim()) {
      toast.error(t("admin.promoteSuperAdmin.toastPasswordRequired"));
      return;
    }

    try {
      const result = await promote.mutateAsync({
        username: trimmedUsername,
        password: password.trim(),
      });

      toast.success(
        t("admin.promoteSuperAdmin.toastSuccess", {
          name: result.user.alias ?? result.user.email,
        })
      );
      setPassword("");
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data
              ?.message
          : null;

      toast.error(message ?? t("admin.promoteSuperAdmin.toastError"));
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <Link
        to="/admin"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
        {t("admin.promoteSuperAdmin.backToAdmin")}
      </Link>

      <div className="rounded-lg border border-border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-foreground">
          {t("admin.promoteSuperAdmin.pageTitle")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("admin.promoteSuperAdmin.pageDescription")}
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="promote-username"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              {t("admin.promoteSuperAdmin.usernameLabel")}
            </label>
            <UserSearchSelect
              inputId="promote-username"
              value={username}
              onValueChange={setUsername}
              onSelectUser={(user) => {
                const alias = user.alias?.trim() ?? "";
                if (alias) {
                  setUsername(alias);
                }
              }}
              placeholder={t("admin.promoteSuperAdmin.usernamePlaceholder")}
              keepTypingText={t("admin.promoteSuperAdmin.keepTypingUsernames")}
              noResultsText={t("admin.promoteSuperAdmin.noMatchingUsernames")}
              userFilter={(user) => {
                const alias = user.alias?.trim();
                return (
                  Boolean(alias) &&
                  alias!.toLowerCase().includes(trimmedUsername.toLowerCase())
                );
              }}
              primaryText={(user) => user.alias?.trim() ?? user.email}
            />

          </div>

          <div>
            <label
              htmlFor="promote-password"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              {t("admin.promoteSuperAdmin.passwordLabel")}
            </label>
            <Input
              id="promote-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t("admin.promoteSuperAdmin.passwordPlaceholder")}
              autoComplete="off"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-brand-primary hover:bg-brand-primary-hover"
            disabled={promote.isPending || !trimmedUsername || !password.trim()}
          >
            {promote.isPending
              ? t("admin.promoteSuperAdmin.submitting")
              : t("admin.promoteSuperAdmin.submit")}
          </Button>
        </form>
      </div>
    </div>
  );
}
