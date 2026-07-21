import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowDown01Icon, UserIcon } from "@/icons/navIcons";
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
} from "@/components/ui/sheet";
import {
  LanguagePickerDropdownItems,
  LanguagePickerSheet,
} from "@/components/LanguagePicker";

type AuthUser = {
  alias?: string | null;
  name?: string | null;
} | null;

type NavLinksRender = (opts: { onNavigate?: () => void }) => ReactNode;

export type AppNavbarMenusProps = {
  isAuthenticated: boolean;
  user: AuthUser;
  languageLabel: string;
  isCompactNav: boolean;
  pageTitle: string;
  mobileMenuOpen: boolean;
  onMobileMenuOpenChange: (open: boolean) => void;
  onLogout: () => Promise<void>;
  renderNavLinks: NavLinksRender;
  /** When true, mount desktop dropdown menus (lg+). */
  showDesktopMenus: boolean;
};

export function AppNavbarMenus({
  isAuthenticated,
  user,
  languageLabel,
  isCompactNav,
  pageTitle,
  mobileMenuOpen,
  onMobileMenuOpenChange,
  onLogout,
  renderNavLinks,
  showDesktopMenus,
}: AppNavbarMenusProps) {
  const { t } = useTranslation();

  const closeMobileMenu = () => onMobileMenuOpenChange(false);

  const handleMobileLogout = () => {
    closeMobileMenu();
    window.requestAnimationFrame(() => {
      void onLogout();
    });
  };

  const renderLanguagePicker = (onAfterChange?: () => void) => (
    <LanguagePickerSheet
      sheetOpen={mobileMenuOpen}
      onAfterChange={onAfterChange}
    />
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
                isCompactNav ? "text-[12px] lg:text-[13px]" : "text-[13px] lg:text-[14px]",
              )}
            >
              <UserIcon size={16} className="shrink-0 text-white lg:h-[17px] lg:w-[17px]" />
              <span
                className={cn(
                  "truncate",
                  isCompactNav ? "max-w-[60px] lg:max-w-[88px]" : "max-w-[72px] lg:max-w-[100px]",
                )}
              >
                {user?.alias?.trim() || user?.name?.trim() || t("profile.title")}
              </span>
              <ArrowDown01Icon
                size={14}
                className="hidden shrink-0 text-white lg:block"
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[12rem]">
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
              <DropdownMenuSubContent alignOffset={-4} className="min-w-[11rem]">
                <LanguagePickerDropdownItems onAfterChange={onAfterNavigate} />
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              className="cursor-pointer"
              onClick={async () => {
                onAfterNavigate?.();
                await onLogout();
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

          <div>{renderLanguagePicker(closeMobileMenu)}</div>

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
          <div>{renderLanguagePicker(closeMobileMenu)}</div>
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
    <>
      {showDesktopMenus ? (
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
              <DropdownMenuContent align="end" className="min-w-[11rem]">
                <LanguagePickerDropdownItems />
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {renderAuthSection()}
        </div>
      ) : null}

      {mobileMenuOpen ? (
        <Sheet open={mobileMenuOpen} onOpenChange={onMobileMenuOpenChange}>
          <SheetContent
            side="right"
            className="flex w-[min(88vw,21rem)] min-w-[18rem] flex-col gap-0 overflow-hidden border-l border-white/10 bg-brand-primary p-0 text-white shadow-[-14px_0_40px_rgba(0,0,0,0.22)]"
            showCloseButton={true}
            closeButtonClassName="text-white hover:bg-white/10 focus:ring-white/40 focus:ring-offset-brand-primary data-[state=open]:!bg-white/10"
          >
            <SheetHeader className="shrink-0 border-b border-white/10 px-4 py-5 pr-12">
              <SheetTitle className="truncate text-[18px] font-semibold leading-none text-white">
                {pageTitle}
              </SheetTitle>
            </SheetHeader>

            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-5">
              {renderNavLinks({ onNavigate: closeMobileMenu })}
            </nav>

            <div
              className="shrink-0 border-t border-white/10 px-4 pt-5"
              style={{
                paddingBottom: "max(1.25rem, env(safe-area-inset-bottom, 1.25rem))",
              }}
            >
              {renderMobileAuthSection()}
            </div>
          </SheetContent>
        </Sheet>
      ) : null}
    </>
  );
}
