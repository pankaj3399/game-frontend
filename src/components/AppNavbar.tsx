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
  "/players/": "myScorePage.sharedTitle",
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
  const iconSize = isInline && compact ? 15 : isInline ? 16 : 18;

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
              "flex items-center leading-none whitespace-nowrap transition-colors",
              isInline
                ? compact
                  ? "gap-1 text-[11px] tracking-tight lg:gap-1 lg:text-[11.5px] xl:gap-1.5 xl:text-[12.5px]"
                  : "gap-1 text-[12px] lg:gap-1 lg:text-[12px] xl:gap-1.5 xl:text-[13px]"
                : "group h-10 gap-3 rounded-[10px] px-3 text-[14px]",
              isInline
                ? isActive
                  ? "font-medium text-white opacity-100"
                  : "font-medium text-white opacity-80 hover:opacity-100"
                : isActive
                  ? "bg-white/12 font-semibold text-white"
                  : "font-medium text-white/85 hover:bg-white/8 hover:text-white",
            )}
          >
            <Icon
              size={iconSize}
              className={cn(
                "shrink-0",
                isInline
                  ? "text-white"
                  : isActive
                    ? "text-white"
                    : "text-white/75 group-hover:text-white",
              )}
            />
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

  const handleMobileLogout = () => {
    closeMobileMenu();
    window.requestAnimationFrame(() => {
      void handleLogout();
    });
  };

  const renderLanguageButtons = (onAfterChange?: () => void) => (
    <>
      <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">
        {t("common.language")}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          className={cn(
            "h-9 flex-1 rounded-[9px] border px-3 text-[13px] font-semibold transition-colors",
            normalizedLanguage === "en"
              ? "border-white bg-white text-brand-primary shadow-sm"
              : "border-white/20 text-white/85 hover:border-white/40 hover:bg-white/10 hover:text-white",
          )}
          onClick={() => {
            handleLanguageChange("en");
            onAfterChange?.();
          }}
        >
          ENG
        </button>
        <button
          type="button"
          className={cn(
            "h-9 flex-1 rounded-[9px] border px-3 text-[13px] font-semibold transition-colors",
            normalizedLanguage === "de"
              ? "border-white bg-white text-brand-primary shadow-sm"
              : "border-white/20 text-white/85 hover:border-white/40 hover:bg-white/10 hover:text-white",
          )}
          onClick={() => {
            handleLanguageChange("de");
            onAfterChange?.();
          }}
        >
          DEU
        </button>
      </div>
    </>
  );

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
              <span className={cn("truncate", isGermanUi ? "max-w-[60px] lg:max-w-[88px]" : "max-w-[72px] lg:max-w-[100px]")}>
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

  const renderMobileAuthSection = () => (
    <>
      {isAuthenticated ? (
        <div className="flex flex-col gap-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/12">
              <UserIcon size={18} className="text-white" />
            </span>
            <p className="min-w-0 truncate text-[14px] font-semibold leading-tight text-white">
              {user?.alias?.trim() || user?.name?.trim() || t("profile.title")}
            </p>
          </div>

          <RoleGuard requireRoleOrAbove={ROLES.SUPER_ADMIN}>
            <Link
              to="/admin"
              className="flex h-9 w-full items-center justify-center rounded-[9px] border border-white/15 px-3 text-[13px] font-semibold text-white transition-colors hover:bg-white/10"
              onClick={closeMobileMenu}
            >
              {t("admin.nav.admin")}
            </Link>
          </RoleGuard>

          <div>{renderLanguageButtons(closeMobileMenu)}</div>

          <button
            type="button"
            className="flex h-9 w-full items-center justify-center rounded-[9px] border border-white/15 px-3 text-[13px] font-semibold text-white transition-colors hover:border-white/30 hover:bg-white/10"
            onClick={handleMobileLogout}
          >
            {t("common.logout")}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div>{renderLanguageButtons(closeMobileMenu)}</div>
          <Link
            to="/login"
            className="flex h-10 w-full items-center justify-center gap-2 rounded-[9px] bg-brand-accent px-3 text-[14px] font-semibold text-[#010a04] transition-colors hover:bg-brand-accent-hover"
            onClick={closeMobileMenu}
          >
            <UserIcon size={16} className="text-[#010a04]" />
            {t("common.login")}
          </Link>
        </div>
      )}
    </>
  );

  return (
    <header
      className="sticky top-0 z-50 w-full"
      style={{
        backgroundColor: "var(--brand-primary)",
        /*
         * iOS 26 / iPhone notch fix: with viewport-fit=cover + black-translucent
         * status bar, content renders *under* the Dynamic Island / notch area.
         * We pad the top of the header by the safe-area-inset so nav items
         * aren't hidden behind it. The CSS custom property fallback (0px) keeps
         * desktop browsers unaffected.
         */
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}
    >
      <div
        className={cn(
          "relative mx-auto grid h-[56px] lg:h-[60px] w-full max-w-[1440px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 px-3 lg:gap-x-2 lg:px-6 xl:px-[72px] xl:gap-x-3"
        )}
      >
        {/* True horizontal center on small screens: grid side columns are unequal widths (logo vs menu),
            so the title must not live in the middle grid cell. */}
        <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center px-[3.25rem] py-1 sm:px-20 lg:hidden">
          <span className="min-w-0 max-w-[min(72vw,18rem)] truncate pb-px text-center text-[22px] font-semibold leading-tight text-[#F4C95D] sm:max-w-[min(70vw,20rem)] sm:text-[24px]">
            {pageTitle}
          </span>
        </div>

        <div className="relative z-10 flex shrink-0 lg:h-[33px] xl:h-[39px]">
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

        <div className="relative z-0 flex min-w-0 w-full justify-center overflow-hidden px-1 lg:z-auto lg:overflow-visible">
          <nav
            className={cn(
              "hidden items-center justify-center lg:flex",
              isGermanUi ? "gap-x-2 xl:gap-x-3" : "gap-x-2.5 xl:gap-x-4"
            )}
          >
            <NavLinks
              variant="inline"
              location={location}
              t={t}
              compact={isGermanUi}
            />
          </nav>
        </div>

        <div className="relative z-10 flex shrink-0 justify-end gap-2 lg:gap-2">
          <div className="hidden items-center gap-2 lg:flex">
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
              /*
               * flex flex-col + overflow-hidden on the Sheet itself:
               * the drawer is a fixed-height panel (full viewport height).
               * Making it a flex column lets us pin the header & auth footer
               * while letting the nav list scroll independently.
               */
              className="flex w-[min(88vw,21rem)] min-w-[18rem] flex-col gap-0 overflow-hidden border-l border-white/10 bg-brand-primary p-0 text-white shadow-[-14px_0_40px_rgba(0,0,0,0.22)]"
              showCloseButton={true}
              closeButtonClassName="text-white hover:bg-white/10 focus:ring-white/40 focus:ring-offset-brand-primary data-[state=open]:!bg-white/10"
            >
              {/* ── Pinned header ─────────────────────────────────────── */}
              <SheetHeader className="shrink-0 border-b border-white/10 px-4 py-5 pr-12">
                <SheetTitle className="truncate text-[18px] font-semibold leading-none text-white">
                  {pageTitle}
                </SheetTitle>
              </SheetHeader>

              {/*
               * ── Scrollable nav list ───────────────────────────────────
               * flex-1 + overflow-y-auto: on small screens (iPhone SE2,
               * 667px height) the nav links may exceed the available space.
               * This makes only the nav area scroll while the auth footer
               * stays pinned at the bottom — so logout is always reachable.
               */}
              <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-5">
                <NavLinks
                  location={location}
                  t={t}
                  onNavigate={closeMobileMenu}
                />
              </nav>

              {/*
               * ── Pinned auth / logout footer ───────────────────────────
               * shrink-0 prevents this section from being squeezed.
               * padding-bottom: env(safe-area-inset-bottom) ensures the
               * logout button is never hidden behind Safari's bottom bar
               * on iPhones with a home indicator (all Face ID models) or
               * behind the browser toolbar on iPhone SE2 / older models.
               */}
              <div
                className="shrink-0 border-t border-white/10 px-4 pt-5"
                style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom, 1.25rem))" }}
              >
                {renderMobileAuthSection()}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
