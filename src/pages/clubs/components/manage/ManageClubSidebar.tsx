import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import InlineLoader from "@/components/shared/InlineLoader";
import { cn } from "@/lib/utils";
import type { AdminClub } from "@/pages/clubs/hooks";
import { ManageClubInfoCard } from "./ManageClubInfoCard";

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
    <aside className={cn("w-full lg:w-[312px]", mobileView === "staff" && "hidden lg:block")}>
      <div className="rounded-[12px] border border-black/8 bg-white px-[15px] py-5 shadow-[0px_3px_15px_0px_rgba(0,0,0,0.06)]">
        <h2 className="text-[18px] font-semibold text-[#010a04]">{t("manageClub.allClubs")}</h2>
        <p className="mb-4 text-[14px] text-[#010a04]/60">{t("manageClub.selectClub")}</p>

        {clubsLoading ? (
          <div className="flex justify-center py-8">
            <InlineLoader />
          </div>
        ) : clubs.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("manageClub.noClubs")}</p>
        ) : (
          <div className="space-y-1 overflow-hidden rounded-[8px] border border-black/10">
            {clubs.map((club) => {
              const isSelected = club.id === effectiveClubId;

              return (
                <button
                  key={club.id}
                  type="button"
                  aria-pressed={isSelected}
                  aria-current={isSelected ? "true" : undefined}
                  onClick={() => onClubSelect(club.id)}
                  className={cn(
                    "flex w-full items-center justify-between border-b border-black/10 px-[12px] py-[15px] text-left last:border-b-0",
                    isSelected ? "bg-[rgba(10,105,37,0.04)] lg:border-l-[3px] lg:border-l-brand-primary lg:pl-[9px]" : "bg-white hover:bg-[#fafafa]"
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-[#d4d4d4]" />
                    <div className="min-w-0">
                      <p className="truncate text-[16px] font-medium text-[#010a04]">{club.name}</p>
                      <p className="text-[12px] text-[#010a04]/60">
                        {t("manageClub.membersCount", { count: club.membersCount ?? 0 })} •{" "}
                        {t("manageClub.eventsCount", { count: club.eventsCount ?? 0 })}
                      </p>
                    </div>
                  </div>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} className="shrink-0 text-[#010a04]/45 lg:hidden" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4 hidden lg:block">
        <ManageClubInfoCard />
      </div>
    </aside>
  );
}
