import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { PlayerNameText } from "@/components/shared/PlayerNameText";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DragDropVerticalIcon,
  PencilEdit01Icon,
  Delete01Icon,
  UserCircle2,
} from "@/icons/figma-icons";
import { cn } from "@/lib/utils";
import type {
  GenerateTournamentDoublesPairsResponse,
  TournamentScheduleMode,
} from "@/models/tournament/types";
import type { ScheduleParticipantRow } from "../helpers/scheduleParticipants";
import { avatarToneClass, initialsFromName } from "../utils/avatarUtils";

interface ScheduleParticipantsTableProps {
  mode: TournamentScheduleMode;
  participants: ScheduleParticipantRow[];
  doublesPairs: GenerateTournamentDoublesPairsResponse | null;
  doublesPairsLoading?: boolean;
  onRemoveParticipant: (id: string) => void;
  onReorderParticipant: (activeId: string, overId: string) => void;
  onEditParticipant: (id: string) => void;
}

function participantToneClass(participant: Pick<ScheduleParticipantRow, "id" | "alias" | "name">): string {
  return avatarToneClass(`${participant.id}:${participant.alias ?? participant.name ?? ""}`);
}

function glickoSkillLevel(participant: ScheduleParticipantRow) {
  const rating = Number.isFinite(participant.rating) ? Math.round(participant.rating) : 1500;
  const rd = typeof participant.rd === "number" && Number.isFinite(participant.rd)
    ? Math.round(participant.rd)
    : 200;
  return `${rating}±${rd}`;
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

interface ParticipantRowActionsProps {
  participant: ScheduleParticipantRow;
  displayName: string;
  onEditParticipant: (id: string) => void;
  onRemoveParticipant: (id: string) => void;
  compact?: boolean;
}

function ParticipantRowActions({
  participant,
  displayName,
  onEditParticipant,
  onRemoveParticipant,
  compact = false,
}: ParticipantRowActionsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onEditParticipant(participant.id)}
        className={cn(
          compact
            ? "h-7 w-7 px-0 text-[#067429] hover:bg-[#067429]/10"
            : "h-7 px-2 text-[12px] text-[#067429] hover:bg-[#067429]/10"
        )}
        aria-label={t("tournaments.scheduleEditParticipant", { name: displayName })}
      >
        <PencilEdit01Icon size={compact ? 15 : 14} className={compact ? undefined : "mr-1"} />
        {compact ? null : t("tournaments.edit")}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onRemoveParticipant(participant.id)}
        className={cn(
          compact
            ? "h-7 w-7 px-0 text-[#d92100] hover:bg-[#d92100]/10"
            : "h-7 px-2 text-[12px] text-[#d92100] hover:bg-[#d92100]/10"
        )}
        aria-label={t("tournaments.removeParticipant", { name: displayName })}
      >
        <Delete01Icon size={compact ? 15 : 14} className={compact ? undefined : "mr-1"} />
        {compact ? null : t("tournaments.remove")}
      </Button>
    </div>
  );
}

interface SortableParticipantsMobileRowProps {
  participant: ScheduleParticipantRow;
  onEditParticipant: (id: string) => void;
  onRemoveParticipant: (id: string) => void;
}

function SortableParticipantsMobileRow({
  participant,
  onEditParticipant,
  onRemoveParticipant,
}: SortableParticipantsMobileRowProps) {
  const { t } = useTranslation();
  const displayName = participant.alias ?? participant.name ?? t("tournaments.unknownPlayer");
  const { attributes, listeners, setActivatorNodeRef, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: participant.id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex items-center justify-between gap-3 border-b border-[#010a04]/10 bg-[#010a04]/[0.04] px-[15px] py-3 last:border-b-0",
        "transition-opacity",
        isDragging && "z-10 opacity-75"
      )}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          type="button"
          className="touch-none text-[#010a04]/45 transition-colors cursor-grab hover:text-[#010a04]/70 active:cursor-grabbing"
          aria-label={t("tournaments.scheduleDragParticipantWithName", {
            name: displayName,
          })}
        >
          <DragDropVerticalIcon size={18} />
        </button>
        <span
          className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${participantToneClass(
            participant
          )} text-[11px] font-semibold text-[#010a04]/80`}
        >
          {initialsFromName(displayName)}
        </span>
        <div className="min-w-0">
          <PlayerNameText name={displayName} className="text-[14px] font-medium text-[#010a04]" focusable />
          <p className="mt-0.5 truncate text-[12px] text-[#010a04]/60">
            {glickoSkillLevel(participant)}
          </p>
        </div>
      </div>

      <ParticipantRowActions
        participant={participant}
        displayName={displayName}
        onEditParticipant={onEditParticipant}
        onRemoveParticipant={onRemoveParticipant}
        compact
      />
    </div>
  );
}

interface SortableParticipantsDesktopRowProps {
  participant: ScheduleParticipantRow;
  index: number;
  onEditParticipant: (id: string) => void;
  onRemoveParticipant: (id: string) => void;
}

function SortableParticipantsDesktopRow({
  participant,
  index,
  onEditParticipant,
  onRemoveParticipant,
}: SortableParticipantsDesktopRowProps) {
  const { t } = useTranslation();
  const displayName = participant.alias ?? participant.name ?? t("tournaments.unknownPlayer");
  const { attributes, listeners, setActivatorNodeRef, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: participant.id });

  return (
    <TableRow
      ref={setNodeRef}
      className={cn(isDragging && "bg-[#010a04]/[0.03]")}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <TableCell className="text-[13px] text-[#010a04]/75">{index + 1}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2.5">
          <button
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            type="button"
            className="touch-none text-[#010a04]/45 transition-colors cursor-grab hover:text-[#010a04]/70 active:cursor-grabbing"
            aria-label={t("tournaments.scheduleDragParticipantWithName", {
              name: displayName,
            })}
          >
            <DragDropVerticalIcon size={16} />
          </button>
          <span
            className={`flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${participantToneClass(
              participant
            )} text-[9px] font-semibold text-[#010a04]/80`}
          >
            {initialsFromName(displayName)}
          </span>
          <PlayerNameText name={displayName} className="text-[14px] text-[#010a04]" focusable />
        </div>
      </TableCell>
      <TableCell className="text-[14px] text-[#010a04]/85">{glickoSkillLevel(participant)}</TableCell>
      <TableCell>
        <ParticipantRowActions
          participant={participant}
          displayName={displayName}
          onEditParticipant={onEditParticipant}
          onRemoveParticipant={onRemoveParticipant}
        />
      </TableCell>
    </TableRow>
  );
}

export function ScheduleParticipantsTable({
  mode,
  participants,
  doublesPairs,
  doublesPairsLoading = false,
  onRemoveParticipant,
  onReorderParticipant,
  onEditParticipant,
}: ScheduleParticipantsTableProps) {
  const { t } = useTranslation();
  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  const participantIds: UniqueIdentifier[] = participants.map((participant) => participant.id);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) {
      return;
    }

    onReorderParticipant(String(active.id), String(over.id));
  };

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

  if (showDoublesLayout && doublesPairsLoading) {
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
                <p className="mb-3 text-[12px] font-medium uppercase text-[#010a04]/70">
                  {t("tournaments.schedulePairLabel", { n: teamRow.teamNumber })}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div
                      className={`flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${participantToneClass(
                        firstPlayer ?? { id: "unknown", alias: null, name: null }
                      )}`}
                    >
                      <UserCircle2 size={24} className="text-white/80" />
                    </div>
                    <span className="min-w-0 leading-tight">
                      <span className="block truncate text-[14px] font-medium text-[#010a04]">
                        {firstPlayer?.alias ?? firstPlayer?.name ?? t("tournaments.unknownPlayer")}
                      </span>
                    </span>
                  </div>
                  <span className="shrink-0 text-[14px] font-medium text-[#010a04]/40">+</span>
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div
                      className={`flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${participantToneClass(
                        secondPlayer ?? { id: "unknown", alias: null, name: null }
                      )}`}
                    >
                      <UserCircle2 size={24} className="text-white/80" />
                    </div>
                    <span className="min-w-0 leading-tight">
                      <span className="block truncate text-[14px] font-medium text-[#010a04]">
                        {secondPlayer?.alias ?? secondPlayer?.name ?? t("tournaments.unknownPlayer")}
                      </span>
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

      </div>
    );
  }

  const mobileSinglesRows = (
    <div className="md:hidden">
      <DndContext
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
        sensors={sensors}
      >
        <SortableContext items={participantIds} strategy={verticalListSortingStrategy}>
          <div className="overflow-hidden rounded-[10px] border border-[rgba(0,0,0,0.08)]">
            {participants.map((participant) => (
              <SortableParticipantsMobileRow
                key={participant.id}
                participant={participant}
                onEditParticipant={onEditParticipant}
                onRemoveParticipant={onRemoveParticipant}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );

  return (
    <>
      {mobileSinglesRows}

      <div className="hidden md:block">
        <DndContext
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
          sensors={sensors}
        >
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
              <SortableContext items={participantIds} strategy={verticalListSortingStrategy}>
                {participants.map((participant, index) => (
                  <SortableParticipantsDesktopRow
                    key={participant.id}
                    participant={participant}
                    index={index}
                    onEditParticipant={onEditParticipant}
                    onRemoveParticipant={onRemoveParticipant}
                  />
                ))}
              </SortableContext>
            </TableBody>
          </Table>
        </DndContext>
      </div>
    </>
  );
}
