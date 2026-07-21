import { Suspense, lazy, useCallback, useState } from "react";
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
  UserIcon,
} from "@/icons/navIcons";
import tb10LogoImage from "@/assets/icons/figma/misc/tb10-logo-frame8.svg";
import { useAuth } from "@/pages/auth/hooks";
import { cn } from "@/lib/utils";
import { useAppLanguage } from "@/hooks/useAppLanguage";
import { usesCompactNavTypography } from "@/lib/appLanguages";
import { TW_BREAKPOINT_LG_PX, useMinWidth } from "@/lib/hooks/useMediaQuery";

const AppNavbarMenus = lazy(() =>
  import("@/components/AppNavbarMenus").then((mod) => ({
    default: mod.AppNavbarMenus,
  })),
);

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
    ([pathA], [pathB]) => pathB.length - pathA.length,
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
  variant?: "menu" | "inline";
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

function useIsLgUp() {
  return useMinWidth(TW_BREAKPOINT_LG_PX);
}

export function AppNavbar() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isLgUp = useIsLgUp();

  const { currentCode, current } = useAppLanguage();
  const isCompactNav = usesCompactNavTypography(currentCode);
  const languageLabel = current.shortLabel;
  const pageTitle = getPageTitle(location.pathname, t);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } finally {
      navigate("/login", { replace: true });
    }
  }, [logout, navigate]);

  const needsMenus = isLgUp || mobileMenuOpen;

  const renderNavLinks = useCallback(
    ({ onNavigate }: { onNavigate?: () => void }) => (
      <NavLinks location={location} t={t} onNavigate={onNavigate} />
    ),
    [location, t],
  );

  return (
    <header
      className="sticky top-0 z-50 h-[56px] w-full lg:h-[60px]"
      style={{ backgroundColor: "var(--brand-primary)" }}
    >
      <div
        className={cn(
          "relative mx-auto grid h-full w-full max-w-[1440px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 px-3 lg:gap-x-2 lg:px-6 xl:px-[72px] xl:gap-x-3",
        )}
      >
        <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center px-[3.75rem] py-1 sm:px-[5.5rem] lg:hidden">
          <span
            className={cn(
              "min-w-0 truncate pb-px text-center font-semibold leading-tight text-brand-accent",
              isCompactNav
                ? "max-w-[min(60vw,15rem)] text-[18px] sm:max-w-[min(62vw,18rem)] sm:text-[20px]"
                : "max-w-[min(64vw,17rem)] text-[21px] sm:max-w-[min(66vw,19rem)] sm:text-[23px]",
            )}
          >
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
              width={144}
              height={28}
              fetchPriority="high"
              decoding="async"
              className="block h-[28px] w-auto shrink-0 md:h-[33px] xl:h-[39px]"
            />
          </Link>
        </div>

        <div className="relative z-0 flex min-w-0 w-full justify-center overflow-hidden px-1 lg:z-auto lg:overflow-visible">
          <nav
            className={cn(
              "hidden items-center justify-center lg:flex",
              isCompactNav ? "gap-x-2 xl:gap-x-3" : "gap-x-2.5 xl:gap-x-4",
            )}
          >
            <NavLinks
              variant="inline"
              location={location}
              t={t}
              compact={isCompactNav}
            />
          </nav>
        </div>

        <div className="relative z-10 flex shrink-0 justify-end gap-2 lg:gap-2">
          {needsMenus ? (
            <Suspense
              fallback={
                !isAuthenticated && isLgUp ? (
                  <Link
                    to="/login"
                    className="flex h-[32px] lg:h-[34px] shrink-0 items-center justify-center gap-1 lg:gap-[7px] rounded-[8px] bg-brand-accent px-3 lg:px-[20px] text-[13px] lg:text-[14px] font-medium text-[#010a04]"
                  >
                    <UserIcon size={16} className="text-[#010a04]" />
                    {t("common.login")}
                  </Link>
                ) : (
                  <div className="hidden h-[34px] w-[90px] lg:block" />
                )
              }
            >
              <AppNavbarMenus
                isAuthenticated={isAuthenticated}
                user={user}
                languageLabel={languageLabel}
                isCompactNav={isCompactNav}
                pageTitle={pageTitle}
                mobileMenuOpen={mobileMenuOpen}
                onMobileMenuOpenChange={setMobileMenuOpen}
                onLogout={handleLogout}
                renderNavLinks={renderNavLinks}
                showDesktopMenus={isLgUp}
              />
            </Suspense>
          ) : null}

          <button
            type="button"
            className="flex items-center justify-center p-0 text-white lg:hidden"
            aria-label={t("common.openMenu")}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu01Icon size={30} className="text-white" aria-hidden />
          </button>
        </div>
      </div>
    </header>
  );
}
