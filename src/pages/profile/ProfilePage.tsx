import { useNavigate, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { useAuth } from "@/pages/auth/hooks";
import { Button } from "@/components/ui/button";
import {
  UserIcon,
  Mail01Icon,
  Calendar03Icon,
  Logout01Icon,
} from "@/icons/figma-icons";
import { ProfileRow } from "@/pages/profile/components/ProfileRow";
import InlineLoader from "@/components/shared/InlineLoader";
import { parseIsoDateSafely } from "@/utils/date";

export default function ProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated, isProfileComplete, loading: authLoading, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  if (authLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center animate-in fade-in duration-300"
        style={{
          background: "linear-gradient(165deg, oklch(0.99 0.005 260) 0%, oklch(0.97 0.01 260) 50%, oklch(0.98 0.008 260) 100%)",
        }}
      >
        <div className="flex flex-col items-center gap-4">
          <InlineLoader />
          <p className="text-sm text-muted-foreground">{t("profile.loading")}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isProfileComplete) return <Navigate to="/information" replace />;

  const displayDate = (() => {
    if (!user?.dateOfBirth) return "—";
    const parsed = parseIsoDateSafely(String(user.dateOfBirth));
    return parsed ? format(parsed, "PPP") : "—";
  })();

  const genderKeyMap: Record<string, string> = {
    male: "signup.male",
    female: "signup.female",
    other: "signup.other",
  };
  const userTypeKeyMap: Record<string, string> = {
    user: "profile.userType.user",
    admin: "profile.userType.admin",
  };
  const displayGender =
    user?.gender && genderKeyMap[user.gender]
      ? t(genderKeyMap[user.gender])
      : "—";
  const displayUserType =
    user?.userType && userTypeKeyMap[user.userType]
      ? t(userTypeKeyMap[user.userType])
      : "—";

  const initials = [user?.name, user?.alias]
    .filter(Boolean)
    .map((s) => s?.charAt(0) ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  return (
    <section
      className="relative min-h-screen w-full py-12 px-4 sm:px-6 md:py-16"
      style={{
        background: "linear-gradient(165deg, oklch(0.99 0.005 260) 0%, oklch(0.97 0.01 260) 50%, oklch(0.98 0.008 260) 100%)",
      }}
    >
      <div className="mx-auto w-full max-w-[560px] animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
        {/* Avatar & header */}
        <div className="mb-8 flex flex-col items-center">
          <div
            className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl text-2xl font-semibold text-foreground shadow-auth-pop-shadow"
            style={{
              background: "linear-gradient(135deg, oklch(0.95 0.02 260), oklch(0.92 0.03 260))",
              border: "1px solid oklch(0.9 0.02 260)",
            }}
          >
            {initials}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            {t("profile.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {user?.alias ?? user?.name ?? ""}
          </p>
        </div>

        {/* Card */}
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card/95 shadow-auth-pop-shadow backdrop-blur-sm">
          <div className="divide-y divide-border/60 px-6 py-6 sm:px-8 sm:py-7">
            <ProfileRow
              icon={<UserIcon size={18} className="text-muted-foreground" />}
              label={t("profile.id")}
              value={user?.id ?? "—"}
              mono
            />
            <ProfileRow
              icon={<Mail01Icon size={18} className="text-muted-foreground" />}
              label={t("signup.emailAddress")}
              value={user?.email ?? "—"}
            />
            <ProfileRow
              icon={<UserIcon size={18} className="text-muted-foreground" />}
              label={t("signup.name")}
              value={user?.name ?? "—"}
            />
            <ProfileRow
              icon={<UserIcon size={18} className="text-muted-foreground" />}
              label={t("signup.alias")}
              value={user?.alias ?? "—"}
            />
            <ProfileRow
              icon={<Calendar03Icon size={18} className="text-muted-foreground" />}
              label={t("signup.dateOfBirth")}
              value={displayDate}
            />
            <ProfileRow
              icon={<UserIcon size={18} className="text-muted-foreground" />}
              label={t("signup.gender")}
              value={displayGender}
            />
            <ProfileRow
              icon={<UserIcon size={18} className="text-muted-foreground" />}
              label={t("profile.userType.label")}
              value={displayUserType}
            />
          </div>

          <div className="border-t border-border/60 px-6 py-5 sm:px-8">
            <Button
              type="button"
              onClick={handleLogout}
              variant="outline"
              className="h-11 w-full gap-2 text-sm text-destructive transition-colors hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40"
            >
              <Logout01Icon size={18} className="text-destructive" />
              {t("common.logout")}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
