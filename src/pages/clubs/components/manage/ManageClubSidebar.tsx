import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import InlineLoader from "@/components/shared/InlineLoader";
import { cn } from "@/lib/utils";
import type { AdminClub } from "@/pages/clubs/hooks";

interface ManageClubSidebarProps {
  clubs: AdminClub[];
  clubsLoading: boolean;
  effectiveClubId: string | null;
  mobileView: "clubs" | "staff";
  onClubSelect: (clubId: string) => void;
}

export function ManageClubSidebar({
  clubs,
  clubsLoading,
  effectiveClubId,
  mobileView,
  onClubSelect,
}: ManageClubSidebarProps) {
  const { t } = useTranslation();

  return (
    <aside
      className={cn(
        "w-full border-b border-border bg-muted/30 p-4 lg:w-80 lg:border-b-0 lg:border-r",
        mobileView === "staff" && "hidden lg:block"
      )}
    >
      <h2 className="text-lg font-semibold text-foreground">{t("manageClub.allClubs")}</h2>
      <p className="mb-4 text-sm text-muted-foreground">{t("manageClub.selectClub")}</p>

      {clubsLoading ? (
        <div className="flex justify-center py-8">
          <InlineLoader />
        </div>
      ) : clubs.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("manageClub.noClubs")}</p>
      ) : (
        <div className="space-y-2">
          {clubs.map((club) => {
            const isSelected = club.id === effectiveClubId;

            return (
              <button
                key={club.id}
                type="button"
                onClick={() => onClubSelect(club.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors",
                  isSelected
                    ? "border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary"
                    : "border-border bg-card hover:bg-muted/50"
                )}
              >
                <div
                  className={cn(
                    "h-3 w-3 shrink-0 rounded-full",
                    isSelected ? "bg-brand-primary" : "bg-muted-foreground/40"
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{club.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("manageClub.membersCount", { count: 0 })} · {t("manageClub.eventsCount", { count: 0 })}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-6 flex gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900/50 dark:bg-blue-950/30">
        <HugeiconsIcon
          icon={InformationCircleIcon}
          size={20}
          className="shrink-0 text-blue-600 dark:text-blue-400"
        />
        <div className="text-sm">
          <p className="font-medium text-foreground">{t("manageClub.adminManagement")}</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-muted-foreground">
            <li>{t("manageClub.ruleDrag")}</li>
            <li>{t("manageClub.ruleDefault")}</li>
            <li>{t("manageClub.ruleExpiry")}</li>
            <li>{t("manageClub.ruleReactivate")}</li>
          </ul>
        </div>
      </div>
    </aside>
  );
}
