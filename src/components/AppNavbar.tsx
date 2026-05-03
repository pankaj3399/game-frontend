import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Menu01Icon,
  Award01Icon,
  ChartIcon,
  PeopleIcon,
  ClipboardIcon,
  Settings01Icon,
  ShieldIcon,
  InformationCircleIcon,
  ArrowDown01Icon,
  UserIcon,
} from "@/icons/figma-icons";
import tb10LogoImage from "@/assets/icons/figma/misc/tb10-logo-frame8.svg";
import { useAuth } from "@/pages/auth/hooks";
import { RoleGuard } from "@/components/auth";
import { ROLES } from "@/constants/roles";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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
  {
    path: "/tournaments",
    labelKey: "settings.nav.tournaments",
    icon: Award01Icon,
  },
  { path: "/my-score", labelKey: "settings.nav.myScore", icon: ChartIcon },
  {
    path: "/record-score",
    labelKey: "settings.nav.recordScore",
    icon: ClipboardIcon,
  },
  { path: "/profile", labelKey: "settings.nav.settings", icon: Settings01Icon },
  { path: "/clubs", labelKey: "settings.nav.clubs", icon: PeopleIcon },
  { path: "/sponsors", labelKey: "settings.nav.sponsors", icon: ShieldIcon },
  {
    path: "/about",
    labelKey: "settings.nav.about",
    icon: InformationCircleIcon,
  },
];

const pathToTitleKey: Record<string, string> = {
  "/profile": "settings.title",
  "/settings-preview": "settings.title",
  "/tournaments": "settings.nav.tournaments",
  "/my-score": "settings.nav.myScore",
  "/record-score": "settings.nav.recordScore",
  "/clubs/manage/sponsors/": "sponsors.title",
  "/clubs/manage": "manageClub.title",
  "/clubs/": "clubs.clubDetails",
  "/clubs": "clubs.allClubs",
  "/sponsors": "sponsors.allSponsors",
  "/about": "settings.nav.about",
  "/information": "signup.title",
  "/admin/sponsors": "admin.platformSponsors.navTitle",
  "/admin/clubs-subscriptions": "admin.subscriptionManagementCta",
  "/admin": "admin.title",
};

function getPageTitle(pathname: string, t: (key: string) => string): string {
  const titleEntries = Object.entries(pathToTitleKey).sort(
    ([pathA], [pathB]) => pathB.length - pathA.length
  );

  for (const [path, key] of titleEntries) {
    if (pathname.startsWith(path)) return t(key);
  }
  return t("profile.title");
}

function NavLinks({
  location,
  t,
  onNavigate,
  variant = "menu",
  compact = false,
}: {
  location: ReturnType<typeof useLocation>;
  t: (key: string) => string;
  onNavigate?: () => void;
  /** Header row: responsive type scale; sheet/menu uses default 14px. */
  variant?: "menu" | "inline";
  /** Compact typography for locales with longer labels. */
  compact?: boolean;
}) {
  const isInline = variant === "inline";
  const iconSize = isInline && compact ? 15 : isInline ? 16 : 17;

  return (
    <>
      {navItems.map(({ path, labelKey, icon: Icon }) => {
        const isActive =
          path === "/profile"
            ? location.pathname.startsWith("/profile")
            : path === "/sponsors"
              ? location.pathname.startsWith("/sponsors") ||
                location.pathname.startsWith("/clubs/manage/sponsors")
              : path === "/clubs"
                ? location.pathname.startsWith("/clubs") &&
                  !location.pathname.startsWith("/clubs/manage/sponsors")
                : location.pathname.startsWith(path);
        return (
          <Link
            key={path}
            to={path}
            onClick={onNavigate}
            className={cn(
              "flex items-center leading-none whitespace-nowrap transition-opacity",
              isInline
                ? compact
                  ? "gap-1 text-[11px] tracking-tight lg:text-[12px] xl:gap-1.5 xl:text-[13px]"
                  : "gap-1.5 text-[12px] lg:gap-1.5 lg:text-[13px] xl:gap-2 xl:text-[14px]"
                : "gap-1.5 text-[14px]",
              isActive
                ? "font-medium text-white opacity-100"
                : "font-medium text-white opacity-80 hover:opacity-100",
            )}
          >
            <Icon size={iconSize} className="shrink-0 text-white" />
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

  const normalizedLanguage = i18n.resolvedLanguage
    ?.toLowerCase()
    .startsWith("de")
    ? "de"
    : "en";
  const isGermanUi = normalizedLanguage === "de";
  const languageLabel = normalizedLanguage === "de" ? "DEU" : "ENG";

  const handleLanguageChange = (language: "en" | "de") => {
    if (language !== normalizedLanguage) {
      void i18n.changeLanguage(language);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  const pageTitle = getPageTitle(location.pathname, t);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const renderAuthSection = (onAfterNavigate?: () => void) => (
    <>
      {isAuthenticated ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex h-[32px] lg:h-[34px] items-center justify-center gap-1 lg:gap-[7px] rounded-[8px] bg-white/25 px-2 lg:px-[10px] font-medium text-white transition-colors hover:bg-white/30",
                isGermanUi ? "text-[12px] lg:text-[13px]" : "text-[13px] lg:text-[14px]"
              )}
            >
              <UserIcon size={16} className="shrink-0 text-white lg:h-[17px] lg:w-[17px]" />
              <span className={cn("truncate", isGermanUi ? "max-w-[70px] lg:max-w-[102px]" : "max-w-[90px] lg:max-w-[120px]")}>
                {user?.alias?.trim() ||
                  user?.name?.trim() ||
                  t("profile.title")}
              </span>
              <ArrowDown01Icon
                size={14}
                className="hidden shrink-0 text-white lg:block"
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[12rem]">
            {/* TODO: Setup-only shortcut. Replace with final admin IA/navigation flow. */}
            <RoleGuard requireRoleOrAbove={ROLES.SUPER_ADMIN}>
              <DropdownMenuItem asChild>
                <Link
                  to="/admin"
                  className="flex cursor-pointer items-center gap-2"
                  onClick={onAfterNavigate}
                >
                  {t("admin.nav.admin")}
                </Link>
              </DropdownMenuItem>
            </RoleGuard>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="cursor-pointer">
                <span className="flex flex-1 items-center justify-between gap-2">
                  <span>{t("common.language")}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {languageLabel}
                  </span>
                </span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent alignOffset={-4} className="min-w-[90px]">
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => {
                    handleLanguageChange("en");
                    onAfterNavigate?.();
                  }}
                >
                  ENG
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => {
                    handleLanguageChange("de");
                    onAfterNavigate?.();
                  }}
                >
                  DEU
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              className="cursor-pointer"
              onClick={async () => {
                onAfterNavigate?.();
                await handleLogout();
              }}
            >
              {t("common.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Link
          to="/login"
          className="flex h-[32px] lg:h-[34px] shrink-0 items-center justify-center gap-1 lg:gap-[7px] rounded-[8px] bg-brand-accent px-3 lg:px-[20px] text-[13px] lg:text-[14px] font-medium text-[#010a04] transition-colors hover:bg-brand-accent-hover"
          onClick={onAfterNavigate}
        >
          <UserIcon size={16} className="text-[#010a04] lg:h-[17px] lg:w-[17px]" />
          {t("common.login")}
        </Link>
      )}
    </>
  );

  return (
    <header
      className="sticky top-0 z-50 h-[56px] w-full lg:h-[60px]"
      style={{ backgroundColor: "var(--brand-primary)" }}
    >
      <div className="relative mx-auto flex h-full w-full max-w-[1440px] items-center justify-between gap-2 px-3 lg:gap-3 lg:px-6 xl:px-[96px]">
        <div className="pointer-events-none absolute inset-x-0 flex justify-center lg:hidden">
          <span className="max-w-[56vw] truncate text-center text-[24px] font-semibold leading-[56px] text-white">
            {pageTitle}
          </span>
        </div>

        <div className="flex min-w-0 shrink items-center gap-2 lg:h-[33px] lg:w-[150px] xl:h-[39px] xl:w-[200px]">
          <Link
            to="/"
            className="inline-flex shrink-0 items-center"
            aria-label="TB10 Home"
          >
            <img
              src={tb10LogoImage}
              alt="TB10 v1.6"
              className="block h-[28px] w-auto shrink-0 md:h-[33px] xl:h-[39px]"
            />
          </Link>
        </div>

        <nav
          className={cn(
            "hidden flex-1 items-center justify-center lg:flex",
            isGermanUi ? "lg:gap-x-3 xl:gap-x-5" : "lg:gap-x-4 xl:gap-x-7"
          )}
        >
          <NavLinks
            variant="inline"
            location={location}
            t={t}
            compact={isGermanUi}
          />
        </nav>

        <div className="flex shrink-0 items-center justify-end gap-2 lg:gap-3">
          <div className={cn("hidden items-center lg:flex", isGermanUi ? "lg:gap-2.5" : "lg:gap-3")}>
            {!isAuthenticated && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex h-[32px] w-[80px] lg:h-[34px] lg:w-[90px] items-center justify-between rounded-[8px] border-[1.2px] border-white/20 pl-[10px] pr-[6px] lg:pl-[12px] lg:pr-[8px] text-[13px] lg:text-[14px] font-medium text-white transition-colors hover:bg-white/10"
                    aria-label={t("common.language")}
                  >
                    {languageLabel}
                    <ArrowDown01Icon size={14} className="shrink-0 text-white" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-[90px] min-w-[90px]"
                >
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => handleLanguageChange("en")}
                  >
                    ENG
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => handleLanguageChange("de")}
                  >
                    DEU
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {renderAuthSection()}
          </div>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="flex items-center justify-center p-0 text-white lg:hidden"
                aria-label={t("common.openMenu")}
              >
                <Menu01Icon size={30} className="text-white" aria-hidden />
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
                  onNavigate={closeMobileMenu}
                />
              </nav>
              <div className="border-t border-white/20 px-4 py-4">
                {!isAuthenticated && (
                  <>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-white/60">
                      {t("common.language")}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className={cn(
                          "flex-1 rounded-[8px] border px-3 py-2 text-[14px] font-medium transition-colors",
                          normalizedLanguage === "en"
                            ? "border-white bg-white/20 text-white"
                            : "border-white/20 text-white/90 hover:bg-white/10",
                        )}
                        onClick={() => {
                          handleLanguageChange("en");
                          closeMobileMenu();
                        }}
                      >
                        ENG
                      </button>
                      <button
                        type="button"
                        className={cn(
                          "flex-1 rounded-[8px] border px-3 py-2 text-[14px] font-medium transition-colors",
                          normalizedLanguage === "de"
                            ? "border-white bg-white/20 text-white"
                            : "border-white/20 text-white/90 hover:bg-white/10",
                        )}
                        onClick={() => {
                          handleLanguageChange("de");
                          closeMobileMenu();
                        }}
                      >
                        DEU
                      </button>
                    </div>
                  </>
                )}
                <div
                  className={cn(
                    "flex w-full min-w-0 flex-col gap-2 [&_button]:w-full [&_a]:flex [&_a]:w-full [&_a]:justify-center",
                    !isAuthenticated && "mt-4",
                  )}
                >
                  {renderAuthSection(closeMobileMenu)}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
