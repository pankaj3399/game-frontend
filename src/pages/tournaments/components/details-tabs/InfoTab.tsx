import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Calendar,
  Clock3,
  Compass,
  Pencil,
  Tag,
  Timer,
  UserCircle2,
  Users,
  UsersRound,
} from "lucide-react";
import type { TournamentDetail } from "@/models/tournament/types";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { getDateFnsLocale } from "@/lib/dateFnsLocale";
import { formatDateDisplay, formatTimeRangeDisplay } from "@/utils/display";
import { EditTournamentInfoModal } from "./EditTournamentInfoModal";

interface InfoTabProps {
  tournament: TournamentDetail;
  onJoin: () => Promise<void>;
  isJoinPending: boolean;
}

export function InfoTab({ tournament, onJoin, isJoinPending }: InfoTabProps) {
  const { t, i18n } = useTranslation();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const spotPercentage = Math.max(0, Math.min(100, tournament.progress.percentage));
  const hasParticipants = tournament.participants.length > 0;
  const feeValue = Number.isFinite(tournament.entryFee) ? tournament.entryFee : 0;

  return (
    <TabsContent value="info" className="mt-6">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 border-t border-[#e6e6e6] pt-6">
          <section className="border-b border-[#e6e6e6] pb-7">
            <h2 className="text-2xl font-semibold leading-snug text-[#111827]">{t("tournaments.info")}</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[#4b5563]">
              {tournament.descriptionInfo || t("tournaments.noDescription")}
            </p>
          </section>

          <section className="border-b border-[#e6e6e6] py-7">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e4e7ec] bg-[#f8fafc] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e5e7eb]">
                  <UsersRound className="size-5 text-[#6b7280]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#111827]">
                    {tournament.club?.name ?? t("tournaments.unknownClub")}
                  </p>
                  <p className="text-xs text-[#6b7280]">{t("tournaments.club")}</p>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-md border-[#d1d5db] bg-white px-4 text-xs font-medium text-[#374151] hover:bg-[#f9fafb]"
              >
                <Compass className="size-4" />
                {t("tournaments.getDirection")}
              </Button>
            </div>

            <div className="mt-6 grid gap-y-5 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 size-4 shrink-0 text-[#6b7280]" />
                <div>
                  <p className="text-sm font-semibold text-[#111827]">
                    {formatDateDisplay(
                      tournament.date,
                      t("tournaments.unscheduled"),
                      getDateFnsLocale(i18n.language)
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-[#6b7280]">{t("tournaments.date")}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock3 className="mt-0.5 size-4 shrink-0 text-[#6b7280]" />
                <div>
                  <p className="text-sm font-semibold text-[#111827]">
                    {formatTimeRangeDisplay(
                      tournament.startTime,
                      tournament.endTime,
                      t("tournaments.unscheduled"),
                      (start, end) => t("tournaments.timeRange", { start, end })
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-[#6b7280]">{t("tournaments.time")}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="mt-0.5 size-4 shrink-0 text-[#6b7280]" />
                <div>
                  <p className="text-sm font-semibold text-[#111827]">{tournament.playMode || t("tournaments.notSpecified")}</p>
                  <p className="mt-0.5 text-xs text-[#6b7280]">{t("tournaments.gameMode")}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Timer className="mt-0.5 size-4 shrink-0 text-[#6b7280]" />
                <div>
                  <p className="text-sm font-semibold text-[#111827]">{tournament.duration || t("tournaments.notSpecified")}</p>
                  <p className="mt-0.5 text-xs text-[#6b7280]">{t("tournaments.matchDuration")}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock3 className="mt-0.5 size-4 shrink-0 text-[#6b7280]" />
                <div>
                  <p className="text-sm font-semibold text-[#111827]">{tournament.breakDuration || t("tournaments.notSpecified")}</p>
                  <p className="mt-0.5 text-xs text-[#6b7280]">{t("tournaments.breakTime")}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Tag className="mt-0.5 size-4 shrink-0 text-[#6b7280]" />
                <div>
                  <p className="text-sm font-semibold text-[#111827]">{t("tournaments.entryFeeFormat", { amount: feeValue })}</p>
                  <p className="mt-0.5 text-xs text-[#6b7280]">{t("tournaments.entryFee")}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="border-b border-[#e6e6e6] py-7">
            <h3 className="text-2xl font-semibold leading-snug text-[#111827]">{t("tournaments.foodDrinks")}</h3>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[#4b5563]">
              {tournament.foodInfo || t("tournaments.noFoodInfo")}
            </p>
          </section>

          <section className="py-7">
            <h3 className="text-2xl font-semibold leading-snug text-[#111827]">
              {t("tournaments.currentPlayers")}
            </h3>
            {!hasParticipants ? (
              <p className="mt-3 text-sm text-[#6b7280]">{t("tournaments.noPlayersYet")}</p>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {tournament.participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center gap-3 rounded-xl border border-[#e5e7eb] bg-white px-4 py-3"
                  >
                    <UserCircle2 className="size-8 shrink-0 text-[#9ca3af]" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#111827]">
                        {participant.name ?? participant.alias ?? t("tournaments.unknownPlayer")}
                      </p>
                      <p className="truncate text-xs text-[#6b7280]">
                        {participant.alias || participant.id.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-6">
          <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold leading-snug text-[#111827]">{t("tournaments.matchProgress")}</h2>
            <div className="mt-3 flex items-center justify-between text-sm">
              <p className="font-medium text-[#374151]">
                {t("tournaments.spotsFilled", {
                  filled: tournament.progress.spotsFilled,
                  total: tournament.progress.spotsTotal,
                })}
              </p>
              <span className="font-medium text-[#6b7280]">{spotPercentage}%</span>
            </div>

            <div className="mt-2 h-2 rounded-full bg-[#eceef1]">
              <div
                className="h-full rounded-full bg-[#f08a00] transition-[width]"
                style={{ width: `${spotPercentage}%` }}
              />
            </div>

            <div className="mt-4 grid grid-cols-2 overflow-hidden rounded-lg border border-[#e5e7eb] text-sm">
              <div className="border-r border-[#e5e7eb] p-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-[#9ca3af]">{t("tournaments.minPlayers")}</p>
                <p className="mt-1 text-lg font-bold text-[#111827]">{tournament.minMember}</p>
              </div>
              <div className="p-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-[#9ca3af]">{t("tournaments.maxPlayers")}</p>
                <p className="mt-1 text-lg font-bold text-[#111827]">{tournament.maxMember}</p>
              </div>
            </div>

            <div className="mt-5 border-t border-[#e6e6e6] pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-[#9ca3af]">{t("tournaments.entryFee")}</p>
              <p className="mt-1 text-3xl font-bold text-[#111827]">
                {t("tournaments.entryFeeFormat", { amount: feeValue })}
              </p>
            </div>

            {tournament.permissions.canJoin && (
              <Button
                className="mt-5 h-11 w-full bg-[#0b8e3f] text-sm font-semibold tracking-wide hover:bg-[#087535]"
                onClick={onJoin}
                disabled={isJoinPending}
              >
                {isJoinPending ? t("common.loading") : t("tournaments.joinThisMatch")}
              </Button>
            )}

            {tournament.permissions.canEdit && (
              <Button
                variant="outline"
                className="mt-3 h-10 w-full border-[#cfd4dc] text-sm font-medium text-[#374151]"
                onClick={() => setIsEditModalOpen(true)}
              >
                <Pencil className="size-4" />
                {t("tournaments.editInfo")}
              </Button>
            )}
          </div>
        </aside>
      </div>

      <EditTournamentInfoModal
        key={tournament.id}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        tournament={tournament}
      />
    </TabsContent>
  );
}
