import { PlusSignIcon, PencilEdit01Icon, IconChevronLeft } from "@/icons/figma-icons";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { ROLES } from "@/constants/roles";
import { TournamentTab, type TournamentListTab } from "@/models/tournament";
import { useTranslation } from "react-i18next";

type OrganiserListButtonsProps = {
  activeTab: TournamentListTab;
  onTabChange: (tab: TournamentListTab) => void;
  onCreate: () => void;
  compact?: boolean;
};

/** Isolated so guests never download the figma-icons barrel on the list page. */
export function OrganiserListButtons({
  activeTab,
  onTabChange,
  onCreate,
  compact = false,
}: OrganiserListButtonsProps) {
  const { t } = useTranslation();

  return (
    <RoleGuard requireRoleOrAbove={ROLES.ORGANISER}>
      {activeTab === TournamentTab.Published ? (
        <Button
          variant="outline"
          size={compact ? "sm" : "default"}
          className={
            compact
              ? "h-8 border-black/12 bg-white px-2.5 text-[12px]"
              : "h-9 min-w-0 flex-1 sm:flex-none"
          }
          onClick={() => onTabChange(TournamentTab.Drafts)}
        >
          <PencilEdit01Icon
            size={compact ? 14 : 16}
            className={compact ? "text-foreground" : "mr-2 shrink-0"}
          />
          <span className={compact ? undefined : "truncate"}>
            {t("tournaments.tabDrafts")}
          </span>
        </Button>
      ) : (
        <Button
          variant="outline"
          size={compact ? "sm" : "default"}
          className={
            compact
              ? "h-8 border-black/12 bg-white px-2.5 text-[12px]"
              : "h-9 min-w-0 flex-1 sm:flex-none"
          }
          onClick={() => onTabChange(TournamentTab.Published)}
        >
          <IconChevronLeft
            size={compact ? 14 : 16}
            className={compact ? "text-foreground" : "mr-2 shrink-0"}
          />
          <span className={compact ? undefined : "truncate"}>
            {t("tournaments.tabPublished")}
          </span>
        </Button>
      )}
      <Button
        variant="brand"
        size={compact ? "sm" : "default"}
        className={compact ? undefined : "h-9 min-w-0 flex-1 sm:flex-none"}
        onClick={onCreate}
      >
        <PlusSignIcon
          size={compact ? 15 : 16}
          className={compact ? "text-white" : "mr-2 shrink-0 text-white"}
        />
        <span className={compact ? "text-[14px] font-medium" : "truncate"}>
          {t("tournaments.create")}
        </span>
      </Button>
    </RoleGuard>
  );
}
