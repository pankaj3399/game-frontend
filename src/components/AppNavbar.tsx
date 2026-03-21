import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Menu01Icon,
  Award01Icon,
  BarChartIcon,
  ClipboardIcon,
  Settings01Icon,
  UserGroupIcon,
  MoneyBag01Icon,
  InformationCircleIcon,
  ArrowDown01Icon,
  UserIcon,
  Logout01Icon,
} from "@hugeicons/core-free-icons";
import { useAuth } from "@/pages/auth/hooks";
import { RoleGuard } from "@/components/auth";
import { ROLES } from "@/constants/roles";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navItems = [
  { path: "/tournaments", labelKey: "settings.nav.tournaments", icon: Award01Icon },
  { path: "/my-score", labelKey: "settings.nav.myScore", icon: BarChartIcon },
  { path: "/record-score", labelKey: "settings.nav.recordScore", icon: ClipboardIcon },
  { path: "/profile", labelKey: "settings.nav.settings", icon: Settings01Icon },
  { path: "/clubs", labelKey: "settings.nav.clubs", icon: UserGroupIcon },
  { path: "/sponsors", labelKey: "settings.nav.sponsors", icon: MoneyBag01Icon },
  { path: "/about", labelKey: "settings.nav.about", icon: InformationCircleIcon },
];

const LANGUAGES = [
  { code: "en", label: "ENG" },
  { code: "de", label: "DEU" },
] as const;

const tb10LogoImage = "https://www.figma.com/api/mcp/asset/5f56c3eb-f8bf-419e-bc2c-0780682ffca6";

const pathToTitleKey: Record<string, string> = {
  "/profile": "settings.title",
  "/settings-preview": "settings.title",
  "/tournaments": "settings.nav.tournaments",
  "/my-score": "settings.nav.myScore",
  "/record-score": "settings.nav.recordScore",
  "/clubs/manage": "manageClub.title",
  "/clubs/": "clubs.clubDetails",
  "/clubs": "clubs.allClubs",
  "/sponsors/manage": "sponsors.title",
  "/sponsors": "sponsors.allSponsors",
  "/about": "settings.nav.about",
  "/information": "signup.title",
  "/admin/sponsors": "admin.platformSponsors.navTitle",
  "/admin/clubs-subscriptions": "admin.title",
  "/admin": "admin.title",
};

function getPageTitle(pathname: string, t: (key: string) => string): string {
  for (const [path, key] of Object.entries(pathToTitleKey)) {
    if (pathname.startsWith(path)) return t(key);
  }
  return t("profile.title");
}

function NavLinks({
  location,
  t,
  onNavigate,
}: {
  location: ReturnType<typeof useLocation>;
  t: (key: string) => string;
  onNavigate?: () => void;
}) {
  return (
    <>
      {navItems.map(({ path, labelKey, icon }) => {
        const isActive = path === "/profile"
          ? location.pathname.startsWith("/profile")
          : location.pathname.startsWith(path);
        return (
          <Link
            key={path}
            to={path}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-1.5 text-[14px] leading-none whitespace-nowrap transition-opacity",
              isActive
                ? "font-medium text-white opacity-100"
                : "font-medium text-white opacity-80 hover:opacity-100"
            )}
          >
            <HugeiconsIcon icon={icon} size={17} />
            {t(labelKey)}
          </Link>
        );
      })}
    </>
  );
}

export function AppNavbar() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const baseLanguage = (i18n.resolvedLanguage || i18n.language || "en").split("-")[0];

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  const pageTitle = getPageTitle(location.pathname, t);

  const authSection = (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="hidden sm:flex h-[34px] w-[90px] items-center justify-between rounded-[8px] border border-white/20 px-3 pr-2 text-[14px] font-medium text-white transition-colors hover:bg-white/5"
            aria-label={t("common.language")}
          >
            {LANGUAGES.find((l) => l.code === baseLanguage)?.label ?? "ENG"}
            <HugeiconsIcon icon={ArrowDown01Icon} size={14} className="shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[10rem] rounded-lg p-1.5 shadow-lg">
          {LANGUAGES.map(({ code, label }) => (
            <DropdownMenuItem
              key={code}
              onClick={() => i18n.changeLanguage(code)}
              className={cn(
                "cursor-pointer px-3 py-2.5 text-sm rounded-md transition-colors",
                  code === baseLanguage && "bg-accent font-medium"
              )}
            >
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {isAuthenticated ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-[32px] items-center justify-center gap-1.5 rounded-[8px] bg-brand-accent px-[15px] text-[14px] font-medium text-[#010a04] transition-colors hover:bg-brand-accent-hover sm:h-[34px] sm:px-5"
            >
              <HugeiconsIcon icon={UserIcon} size={17} className="shrink-0" />
              <span className="max-w-[78px] truncate sm:max-w-[120px]">{user?.alias?.trim() || user?.name?.trim() || t("profile.title")}</span>
              <HugeiconsIcon icon={ArrowDown01Icon} size={14} className="hidden shrink-0 sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {/* TODO: Setup-only shortcut. Replace with final admin IA/navigation flow. */}
            <RoleGuard requireRoleOrAbove={ROLES.SUPER_ADMIN}>
              <DropdownMenuItem asChild>
                <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
                  <HugeiconsIcon icon={Award01Icon} size={18} />
                  {t("admin.nav.admin")}
                </Link>
              </DropdownMenuItem>
            </RoleGuard>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleLogout} className="cursor-pointer">
              <HugeiconsIcon icon={Logout01Icon} size={18} />
              {t("common.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Link
          to="/login"
          className="flex h-[32px] shrink-0 items-center justify-center gap-1.5 rounded-[8px] bg-brand-accent px-[15px] text-[14px] font-medium text-[#010a04] transition-colors hover:bg-brand-accent-hover sm:h-[34px] sm:w-[100px] sm:px-5"
        >
          <HugeiconsIcon icon={UserIcon} size={17} />
          {t("common.login")}
        </Link>
      )}
    </>
  );

  return (
    <header
      className="sticky top-0 z-50 h-[56px] w-full sm:h-[60px]"
      style={{ backgroundColor: "var(--brand-primary)" }}
    >
      <div className="mx-auto flex h-full w-full max-w-[1440px] min-w-0 items-center justify-between px-5 sm:px-6 lg:px-[96px]">
        <div className="flex h-[33px] w-[169px] items-center sm:h-[39px] sm:w-[200px]">
          <Link to="/" className="inline-flex items-center" aria-label="TB10 Home">
            <img src={tb10LogoImage} alt="TB10 v1.6" className="block h-[33px] w-auto sm:h-[39px]" />
          </Link>
        </div>

        <nav className="hidden flex-1 items-center justify-center gap-[25px] lg:flex">
          <NavLinks location={location} t={t} />
        </nav>

        <div className="flex flex-shrink-0 items-center justify-end gap-[10px]">
          {authSection}

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="flex items-center justify-center p-0 text-white lg:hidden"
                aria-label="Open menu"
              >
                <HugeiconsIcon icon={Menu01Icon} size={30} aria-hidden />
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[min(90vw,22rem)] min-w-[18rem] border-0 bg-brand-primary p-0"
              showCloseButton={true}
            >
              <SheetHeader className="border-b border-white/20 px-4 py-4">
                <SheetTitle className="text-lg font-semibold text-white">
                  {pageTitle}
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-3 p-4">
                <NavLinks
                  location={location}
                  t={t}
                  onNavigate={() => setMobileMenuOpen(false)}
                />
                <div className="mt-4 border-t border-white/20 pt-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-white/80">
                    {t("common.language")}
                  </p>
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-white/15"
                        aria-label={t("common.language")}
                      >
                        {LANGUAGES.find((l) => l.code === baseLanguage)?.label ?? "ENG"}
                        <HugeiconsIcon icon={ArrowDown01Icon} size={16} className="shrink-0" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      side="bottom"
                      sideOffset={8}
                      className="z-[100] w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] rounded-lg border border-white/20 bg-white/95 p-1.5 text-[#1a1a1a] shadow-xl backdrop-blur-md"
                    >
                      {LANGUAGES.map(({ code, label }) => (
                        <DropdownMenuItem
                          key={code}
                          onClick={() => {
                            i18n.changeLanguage(code);
                            setMobileMenuOpen(false);
                          }}
                          className={cn(
                            "cursor-pointer rounded-md px-3 py-2.5 text-sm transition-colors",
                            code === baseLanguage && "bg-accent font-medium"
                          )}
                        >
                          {label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
