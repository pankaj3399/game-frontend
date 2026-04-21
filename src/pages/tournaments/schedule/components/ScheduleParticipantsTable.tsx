import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  IconChevronDown,
  ChevronUp,
  IconPlus,
  PencilEdit01Icon,
  Delete01Icon,
} from "@/icons/figma-icons";
import type {
  GenerateTournamentDoublesPairsResponse,
  TournamentSchedulePairPlayer,
  TournamentScheduleMode,
} from "@/models/tournament/types";
import type { ScheduleParticipantRow } from "../helpers/scheduleParticipants";
import { avatarToneClass, initialsFromName } from "../utils/avatarUtils";

interface ScheduleParticipantsTableProps {
  mode: TournamentScheduleMode;
  participants: ScheduleParticipantRow[];
  doublesPairs: GenerateTournamentDoublesPairsResponse | null;
  /** True while doubles pairs are being requested; shows layout skeletons instead of a loading label on the tab. */
  doublesPairsLoading?: boolean;
  onRemoveParticipant: (id: string) => void;
  onMoveParticipant: (index: number, direction: "up" | "down") => void;
  onEditParticipant: () => void;
}

function playerToneClass(player: TournamentSchedulePairPlayer): string {
  return avatarToneClass(`${player.id}:${player.name ?? ""}`);
}

function participantToneClass(participant: ScheduleParticipantRow): string {
  return avatarToneClass(`${participant.id}:${participant.name ?? participant.alias ?? ""}`);
}

function glickoSkillLevel(participant: ScheduleParticipantRow) {
  const rating = Number.isFinite(participant.rating) ? Math.round(participant.rating) : 1500;
  const rd = typeof participant.rd === "number" && Number.isFinite(participant.rd)
    ? Math.round(participant.rd)
    : 200;
  return `${rating}±${rd}`;
}

interface DoublesPlayerChipProps {
  player: TournamentSchedulePairPlayer;
  fallbackName: string;
}

function DoublesPlayerChip({ player, fallbackName }: DoublesPlayerChipProps) {
  const displayName = player.alias ?? player.name ?? fallbackName;

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <span
        className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${playerToneClass(
          player
        )} text-[11px] font-semibold text-[#010a04]/80`}
      >
        {initialsFromName(displayName)}
      </span>
      <span className="truncate text-[14px] font-medium text-[#010a04]">{displayName}</span>
    </div>
  );
}

function DoublesPairSkeleton({ index }: { index: number }) {
  return (
    <div
      className="rounded-[10px] border border-[#e1e3e8] bg-[#fafbfc] px-[15px] py-[15px] shadow-[inset_0_0_0_1px_rgba(1,10,4,0.03)]"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="mb-3.5 h-3 w-14 animate-skeleton-soft rounded bg-[#010a04]/[0.08]" />
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3.5">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="h-[34px] w-[34px] shrink-0 animate-skeleton-soft rounded-full bg-[#010a04]/[0.08]" />
          <div className="h-3.5 min-w-0 flex-1 animate-skeleton-soft rounded bg-[#010a04]/[0.08]" />
        </div>
        <div className="h-3 w-3 shrink-0 animate-skeleton-soft rounded bg-[#010a04]/[0.06]" />
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="h-[34px] w-[34px] shrink-0 animate-skeleton-soft rounded-full bg-[#010a04]/[0.08]" />
          <div className="h-3.5 min-w-0 flex-1 animate-skeleton-soft rounded bg-[#010a04]/[0.08]" />
        </div>
      </div>
    </div>
  );
}

export function ScheduleParticipantsTable({
  mode,
  participants,
  doublesPairs,
  doublesPairsLoading = false,
  onRemoveParticipant,
  onMoveParticipant,
  onEditParticipant,
}: ScheduleParticipantsTableProps) {
  const { t } = useTranslation();

  const doublesRows =
    mode === "doubles" && doublesPairs
      ? doublesPairs.teams.map((team) => ({
          id: `team-${team.team}`,
          teamNumber: team.team,
          players: team.players,
        }))
      : [];

  const showDoublesLayout =
    mode === "doubles" && (doublesPairs != null || doublesPairsLoading);

  if (showDoublesLayout && doublesPairsLoading && !doublesPairs) {
    const pairCount = Math.max(1, Math.floor(participants.length / 2));
    return (
      <div className="space-y-3.5">
        <p className="sr-only" role="status">
          {t("tournaments.scheduleDoublesArranging")}
        </p>
        <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: pairCount }, (_, index) => (
            <DoublesPairSkeleton key={index} index={index} />
          ))}
        </div>
      </div>
    );
  }

  if (showDoublesLayout && doublesPairs) {
    return (
      <div className="space-y-3.5">
        <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
          {doublesRows.map((teamRow) => {
            const firstPlayer =
              Array.isArray(teamRow.players) && teamRow.players.length > 0
                ? teamRow.players[0]
                : null;
            const secondPlayer =
              Array.isArray(teamRow.players) && teamRow.players.length > 1
                ? teamRow.players[1]
                : null;

            return (
              <article
                key={teamRow.id}
                className="animate-in fade-in zoom-in-95 rounded-[10px] border border-[rgba(0,0,0,0.12)] px-[15px] py-[15px] duration-300 fill-mode-both"
              >
                <p className="mb-3.5 text-[12px] font-medium uppercase text-[#010a04]/70">
                  {t("tournaments.schedulePairLabel", { n: teamRow.teamNumber })}
                </p>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3.5">
                  {firstPlayer ? (
                    <DoublesPlayerChip
                      player={firstPlayer}
                      fallbackName={t("tournaments.unknownPlayer")}
                    />
                  ) : (
                    <span className="truncate text-[14px] font-medium text-[#010a04]/55">
                      {t("tournaments.unknownPlayer")}
                    </span>
                  )}
                  <IconPlus size={15} className="text-[#010a04]/60" />
                  {secondPlayer ? (
                    <DoublesPlayerChip
                      player={secondPlayer}
                      fallbackName={t("tournaments.unknownPlayer")}
                    />
                  ) : (
                    <span className="truncate text-[14px] font-medium text-[#010a04]/55">
                      {t("tournaments.unknownPlayer")}
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {doublesPairs.unpaired.length > 0 ? (
          <div className="rounded-[10px] border border-dashed border-[#010a04]/20 bg-[#010a04]/[0.02] px-4 py-3 text-[13px] text-[#010a04]/75">
            {t("tournaments.scheduleUnpairedList", {
              names: doublesPairs.unpaired
                .map((player) => player.alias ?? player.name ?? t("tournaments.unknownPlayer"))
                .join(", "),
            })}
          </div>
        ) : null}
      </div>
    );
  }

  const mobileSinglesRows = (
    <div className="overflow-hidden rounded-[10px] border border-[rgba(0,0,0,0.08)] md:hidden">
      {participants.map((participant, index) => {
        const displayName = participant.alias ?? participant.name ?? t("tournaments.unknownPlayer");
        const canMoveUp = index > 0;
        const canMoveDown = index < participants.length - 1;

        return (
          <div
            key={participant.id}
            className="flex items-center justify-between gap-3 border-b border-[#010a04]/10 bg-[#010a04]/[0.04] px-[15px] py-3 last:border-b-0"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span
                className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${participantToneClass(
                  participant
                )} text-[11px] font-semibold text-[#010a04]/80`}
              >
                {initialsFromName(displayName)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[14px] font-medium text-[#010a04]">{displayName}</p>
                <div className="mt-0.5 flex items-center gap-2 text-[12px]">
                  <span className="truncate text-[#010a04]/60">{glickoSkillLevel(participant)}</span>
                  <span className="text-[#010a04]/25">•</span>
                  <button
                    type="button"
                    onClick={() => onRemoveParticipant(participant.id)}
                    className="text-[#d92100] hover:underline"
                  >
                    {t("tournaments.remove")}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onEditParticipant}
                className="h-7 w-7 px-0 text-[#067429] hover:bg-[#067429]/10"
                aria-label={t("tournaments.edit")}
              >
                <PencilEdit01Icon size={15} />
              </Button>
              <div className="flex flex-col items-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onMoveParticipant(index, "up")}
                  className="h-4 w-5 p-0 text-[#010a04]/55 hover:bg-transparent"
                  disabled={!canMoveUp}
                  aria-label={t("tournaments.scheduleMoveParticipantUp")}
                >
                  <ChevronUp size={12} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onMoveParticipant(index, "down")}
                  className="h-4 w-5 p-0 text-[#010a04]/55 hover:bg-transparent"
                  disabled={!canMoveDown}
                  aria-label={t("tournaments.scheduleMoveParticipantDown")}
                >
                  <IconChevronDown size={12} />
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      {mobileSinglesRows}

      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#010a04]/[0.04] hover:bg-[#010a04]/[0.04]">
              <TableHead className="w-10 text-[12px] font-normal text-[#010a04]/70">#</TableHead>
              <TableHead className="text-[12px] font-normal text-[#010a04]/70">{t("tournaments.players")}</TableHead>
              <TableHead className="w-[180px] text-[12px] font-normal text-[#010a04]/70">{t("tournaments.skillLevel")}</TableHead>
              <TableHead className="w-[220px] text-[12px] font-normal text-[#010a04]/70">{t("tournaments.actions")}</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {participants.map((participant, index) => (
              <TableRow key={participant.id}>
                <TableCell className="text-[13px] text-[#010a04]/75">{index + 1}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${participantToneClass(
                        participant
                      )} text-[9px] font-semibold text-[#010a04]/80`}
                    >
                      {initialsFromName(
                        participant.alias ?? participant.name ?? t("tournaments.unknownPlayer")
                      )}
                    </span>
                    <span className="text-[14px] text-[#010a04]">
                      {participant.alias ?? participant.name ?? t("tournaments.unknownPlayer")}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-[14px] text-[#010a04]/85">{glickoSkillLevel(participant)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={onEditParticipant}
                      className="h-7 px-2 text-[12px] text-[#067429] hover:bg-[#067429]/10"
                    >
                      <PencilEdit01Icon size={14} className="mr-1" />
                      {t("tournaments.edit")}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveParticipant(participant.id)}
                      className="h-7 px-2 text-[12px] text-[#d92100] hover:bg-[#d92100]/10"
                    >
                      <Delete01Icon size={14} className="mr-1" />
                      {t("tournaments.remove")}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onMoveParticipant(index, "up")}
                      className="h-7 px-1.5 text-[#6a6a6a] hover:bg-[#010a04]/5"
                      disabled={index === 0}
                      aria-label={t("tournaments.scheduleMoveParticipantUp")}
                    >
                      <ChevronUp size={14} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onMoveParticipant(index, "down")}
                      className="h-7 px-1.5 text-[#6a6a6a] hover:bg-[#010a04]/5"
                      disabled={index === participants.length - 1}
                      aria-label={t("tournaments.scheduleMoveParticipantDown")}
                    >
                      <IconChevronDown size={14} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
