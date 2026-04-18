import { Button } from "@/components/ui/button";
import { Pencil } from "@/icons/figma-icons";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { TournamentDetail } from "@/models/tournament/types";
import type { TFunction } from "i18next";

interface SidebarProps {
  className?: string;
  tournament: TournamentDetail;
  spotPercentage: number;
  onParticipationAction: () => Promise<void>;
  isParticipationPending: boolean;
  onEdit: () => void;
  t: TFunction;
}

export function Sidebar({
  className,
  tournament,
  spotPercentage,
  onParticipationAction,
  isParticipationPending,
  onEdit,
  t,
}: SidebarProps) {
  const canJoin = tournament.permissions.canJoin;
  const canLeave = tournament.permissions.canLeave;
  const isParticipant = tournament.permissions.isParticipant;
  const participationDisabled = isParticipant && !canLeave;
  const showParticipationButton = canJoin || isParticipant;
  const participationButtonClass = isParticipant
    ? "h-[42px] w-full rounded-[12px] bg-[#e8c15a] text-[16px] font-medium text-[#111111] hover:bg-[#ddb44c]"
    : "h-[42px] w-full rounded-[8px] bg-gradient-to-r from-[#0a6925] via-[#0c7b2c] to-[#0f8d33] text-[16px] font-medium text-white hover:opacity-95";

  return (
    <aside className={["xl:sticky xl:top-7", className].filter(Boolean).join(" ")}>
      <div className="rounded-[12px] border border-[#dddddd] bg-transparent px-5 py-[22px] shadow-[0_6px_16px_rgba(0,0,0,0.12)]">
        <p className="text-[20px] font-medium text-[#010a04]">{t("tournaments.matchProgress")}</p>

        <div className="mt-6 space-y-[18px]">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[14px] leading-5">
              <p className="text-[#010a04]">
                {t("tournaments.spotsFilled", {
                  filled: tournament.progress.spotsFilled,
                  total: tournament.progress.spotsTotal,
                })}
              </p>
              <p className="text-[#010a04]/60">{spotPercentage}%</p>
            </div>

            <div className="h-[15px] rounded-[111px] bg-[#d9d9d9]/40">
              <div
                className="h-[15px] rounded-[111px] bg-[#D96D00] transition-[width]"
                style={{ width: `${spotPercentage}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 overflow-hidden rounded-[8px] border border-[#010a04]/15">
            <div className="px-3 py-[11px]">
              <p className="text-[10px] uppercase leading-3 text-[#010a04]/80">{t("tournaments.minPlayers")}</p>
              <p className="mt-[3px] text-[14px] leading-[18px] text-[#010a04]">{tournament.minMember}</p>
            </div>
            <div className="border-l border-[#010a04]/15 px-[13px] py-[11px]">
              <p className="text-[10px] uppercase leading-3 text-[#010a04]/80">{t("tournaments.maxPlayers")}</p>
              <p className="mt-[3px] text-[14px] leading-[18px] text-[#010a04]">{tournament.maxMember}</p>
            </div>
          </div>
        </div>

        <div className="my-6 h-px w-full bg-[#dddddd]" />

        <div className="space-y-3">
          {showParticipationButton &&
            (participationDisabled ? (
              <Button
                type="button"
                className={cn(participationButtonClass, "cursor-not-allowed opacity-80")}
                aria-disabled
                onClick={() => toast.warning(t("tournaments.leaveLockedAfterSchedule"))}
              >
                {t("tournaments.leaveMatch")}
              </Button>
            ) : (
              <Button
                className={participationButtonClass}
                onClick={onParticipationAction}
                disabled={isParticipationPending}
              >
                {isParticipationPending
                  ? t("common.loading")
                  : isParticipant
                    ? t("tournaments.leaveMatch")
                    : t("tournaments.joinThisMatch")}
              </Button>
            ))}

          {tournament.permissions.canEdit && (
            <Button
              variant="outline"
              className="h-[42px] w-full gap-[11px] rounded-[10px] border border-[#010a04] bg-transparent text-[16px] font-medium text-[#010a04] hover:bg-[#010a04]/[0.02]"
              onClick={onEdit}
            >
              <Pencil size={18} className="text-[#010a04]" />
              {t("tournaments.editInfo")}
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}
