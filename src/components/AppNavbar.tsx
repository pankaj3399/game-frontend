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
  LockIcon,
  Logout01Icon,
} from "@hugeicons/core-free-icons";
import { useAuth } from "@/hooks/auth";
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
  { path: "/clubs", labelKey: "settings.nav.clubs", icon: UserGroupIcon },
  { path: "/sponsors", labelKey: "settings.nav.sponsors", icon: MoneyBag01Icon },
  { path: "/about", labelKey: "settings.nav.about", icon: InformationCircleIcon },
];

const LANGUAGES = [
  { code: "en", label: "ENG" },
  { code: "de", label: "DEU" },
] as const;

const pathToTitleKey: Record<string, string> = {
  "/profile": "settings.title",
  "/settings-preview": "settings.title",
  "/tournaments": "settings.nav.tournaments",
  "/my-score": "settings.nav.myScore",
  "/record-score": "settings.nav.recordScore",
  "/clubs": "manageClub.title",
  "/sponsors": "sponsors.title",
  "/about": "settings.nav.about",
  "/information": "signup.title",
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
        const isActive = location.pathname.startsWith(path);
        return (
          <Link
            key={path}
            to={path}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-md text-sm whitespace-nowrap transition-colors",
              isActive
                ? "font-semibold text-white bg-white/15"
                : "font-medium text-white/90 hover:text-white hover:bg-white/10"
            )}
          >
            <HugeiconsIcon icon={icon} size={20} />
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
            className="hidden sm:flex items-center gap-2 text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-white/10 transition-colors border border-transparent hover:border-white/10"
            aria-label={t("common.language")}
          >
            {LANGUAGES.find((l) => l.code === i18n.language)?.label ?? "ENG"}
            <HugeiconsIcon icon={ArrowDown01Icon} size={16} className="shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[11rem] p-1.5 rounded-lg shadow-lg">
          {LANGUAGES.map(({ code, label }) => (
            <DropdownMenuItem
              key={code}
              onClick={() => i18n.changeLanguage(code)}
              className={cn(
                "cursor-pointer px-3 py-2.5 text-sm rounded-md transition-colors",
                code === i18n.language && "bg-accent font-medium"
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
              className="flex items-center gap-2 px-3 py-2 sm:px-4 rounded-md font-medium text-sm bg-brand-accent text-[#1a1a1a] hover:bg-brand-accent-hover transition-colors max-w-[140px] sm:max-w-none"
            >
              <span className="truncate">{user?.alias?.trim() || user?.name?.trim() || t("profile.title")}</span>
              <HugeiconsIcon icon={ArrowDown01Icon} size={16} className="shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                <HugeiconsIcon icon={Settings01Icon} size={18} />
                {t("settings.nav.settings")}
              </Link>
            </DropdownMenuItem>
            <RoleGuard requireRoleOrAbove={ROLES.SUPER_ADMIN}>
              <DropdownMenuItem asChild>
                <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
                  <HugeiconsIcon icon={Award01Icon} size={18} />
                  Admin
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
          className="flex items-center gap-2 px-3 py-2 sm:px-4 rounded-md font-medium text-sm bg-brand-accent text-[#1a1a1a] hover:bg-brand-accent-hover transition-colors shrink-0"
        >
          <HugeiconsIcon icon={LockIcon} size={18} />
          {t("common.login")}
        </Link>
      )}
    </>
  );

  return (
    <header
      className="sticky top-0 z-50 flex w-full min-w-0 items-center gap-4 px-4 py-3 sm:gap-6 sm:px-6 sm:py-4 lg:px-8"
      style={{ backgroundColor: "var(--brand-primary)" }}
    >
      {/* Mobile: page title on left */}
      <div className="flex min-w-0 flex-1 items-center lg:flex-none lg:flex-1">
        <span className="truncate text-base font-semibold text-white lg:sr-only">
          {pageTitle}
        </span>
      </div>

      {/* Desktop: centered nav (hidden below lg) */}
      <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
        <NavLinks location={location} t={t} />
      </nav>

      {/* Right section: hamburger (mobile) + auth */}
      <div className="flex flex-shrink-0 items-center justify-end gap-2 sm:gap-3">
        {/* Mobile hamburger menu */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="flex items-center justify-center p-2 text-white rounded-md hover:bg-white/10 transition-colors lg:hidden"
              aria-label="Open menu"
            >
              <HugeiconsIcon icon={Menu01Icon} size={24} aria-hidden />
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
            <nav className="flex flex-col gap-1 p-4">
              <NavLinks
                location={location}
                t={t}
                onNavigate={() => setMobileMenuOpen(false)}
              />
              <div className="mt-4 pt-4 border-t border-white/20 px-4">
                <p className="mb-2 text-xs font-medium text-white/80 uppercase tracking-wider">
                  {t("common.language")}
                </p>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="w-full flex items-center justify-between gap-2 text-white text-sm font-medium px-4 py-3 rounded-lg bg-white/10 hover:bg-white/15 transition-colors border border-white/10"
                      aria-label={t("common.language")}
                    >
                      {LANGUAGES.find((l) => l.code === i18n.language)?.label ?? "ENG"}
                      <HugeiconsIcon icon={ArrowDown01Icon} size={16} className="shrink-0" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    side="bottom"
                    sideOffset={8}
                    className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] p-1.5 rounded-lg border border-white/20 bg-white/95 backdrop-blur-md text-[#1a1a1a] shadow-xl z-[100]"
                  >
                    {LANGUAGES.map(({ code, label }) => (
                      <DropdownMenuItem
                        key={code}
                        onClick={() => {
                          i18n.changeLanguage(code);
                          setMobileMenuOpen(false);
                        }}
                        className={cn(
                          "cursor-pointer px-3 py-2.5 text-sm rounded-md transition-colors",
                          code === i18n.language && "bg-accent font-medium"
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

        {authSection}
      </div>
    </header>
  );
}
