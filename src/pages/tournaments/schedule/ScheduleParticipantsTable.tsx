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
import type { ScheduleParticipantRow } from "./helpers";

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

const AVATAR_TONES = [
  "from-[#f7d4bf] to-[#efb598]",
  "from-[#d5e5f6] to-[#acc8e7]",
  "from-[#d9efdd] to-[#b9dfc4]",
  "from-[#f7e5bb] to-[#efd587]",
  "from-[#e8ddfb] to-[#cab6ef]",
  "from-[#ffd8e0] to-[#f4b3c2]",
];

function hashSeed(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (Math.imul(hash, 31) + value.charCodeAt(index)) | 0;
  }
  return (hash >>> 0) % 2147483647;
}

function initialsFromName(name: string): string {
  const tokens = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (tokens.length === 0) {
    return "?";
  }

  const first = tokens[0][0] ?? "";
  const second = tokens.length > 1 ? tokens[tokens.length - 1][0] ?? "" : "";
  return `${first}${second}`.toUpperCase();
}

function playerToneClass(player: TournamentSchedulePairPlayer): string {
  const seed = hashSeed(`${player.id}:${player.name ?? ""}`);
  return AVATAR_TONES[seed % AVATAR_TONES.length] ?? AVATAR_TONES[0];
}

interface DoublesPlayerChipProps {
  player: TournamentSchedulePairPlayer;
  fallbackName: string;
}

function DoublesPlayerChip({ player, fallbackName }: DoublesPlayerChipProps) {
  const displayName = player.name ?? fallbackName;

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
      <div className="mb-3.5 h-3 w-14 animate-pulse rounded bg-[#010a04]/[0.08]" />
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3.5">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="h-[34px] w-[34px] shrink-0 animate-pulse rounded-full bg-[#010a04]/[0.08]" />
          <div className="h-3.5 min-w-0 flex-1 animate-pulse rounded bg-[#010a04]/[0.08]" />
        </div>
        <div className="h-3 w-3 shrink-0 animate-pulse rounded bg-[#010a04]/[0.06]" />
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="h-[34px] w-[34px] shrink-0 animate-pulse rounded-full bg-[#010a04]/[0.08]" />
          <div className="h-3.5 min-w-0 flex-1 animate-pulse rounded bg-[#010a04]/[0.08]" />
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
            const hasCompletePair = Array.isArray(teamRow.players) && teamRow.players.length >= 2;
            const firstPlayer = hasCompletePair ? teamRow.players[0] : null;
            const secondPlayer = hasCompletePair ? teamRow.players[1] : null;

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
                .map((player) => player.name ?? t("tournaments.unknownPlayer"))
                .join(", "),
            })}
          </div>
        ) : null}
      </div>
    );
  }

  return (
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
                <span className="h-[18px] w-[18px] rounded-full bg-[#d9d9d9]" />
                <span className="text-[14px] text-[#010a04]">
                  {participant.name ?? t("tournaments.unknownPlayer")}
                </span>
              </div>
            </TableCell>
            <TableCell className="text-[14px] text-[#010a04]/85">{participant.skillLabel}</TableCell>
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
                  aria-label="Move participant up"
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
                  aria-label="Move participant down"
                >
                  <IconChevronDown size={14} />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
