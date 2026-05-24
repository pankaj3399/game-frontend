import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { useMemo, useState, type CSSProperties } from "react";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS, type Transform } from "@dnd-kit/utilities";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { PlayerNameText } from "@/components/shared/PlayerNameText";
import {
  DragDropVerticalIcon,
  Delete01Icon,
  UserCircle2,
} from "@/icons/figma-icons";
import { cn } from "@/lib/utils";
import type {
  GenerateTournamentDoublesPairsResponse,
  TournamentScheduleMode,
} from "@/models/tournament/types";
import {
  hasCustomSchedulingOrder,
  type ScheduleParticipantRow,
} from "../helpers/scheduleParticipants";
import { avatarToneClass, initialsFromName } from "../utils/avatarUtils";

interface ScheduleParticipantsTableProps {
  mode: TournamentScheduleMode;
  participants: ScheduleParticipantRow[];
  doublesPairs: GenerateTournamentDoublesPairsResponse | null;
  doublesPairsLoading?: boolean;
  onRemoveParticipant: (id: string) => void;
  onReorderParticipant: (activeId: string, overId: string) => void;
}

function participantToneClass(participant: Pick<ScheduleParticipantRow, "id" | "alias" | "name">): string {
  return avatarToneClass(`${participant.id}:${participant.alias ?? participant.name ?? ""}`);
}

function ScheduleParticipantAvatar({
  profilePictureUrl,
  displayName,
  wrapperClassName,
}: {
  profilePictureUrl: string | null | undefined;
  displayName: string;
  wrapperClassName: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <span className={wrapperClassName}>
      {profilePictureUrl && !imageFailed ? (
        <img
          src={profilePictureUrl}
          alt={`Avatar for ${displayName}`}
          className="size-full rounded-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        initialsFromName(displayName)
      )}
    </span>
  );
}

function DoublesPairPlayerAvatar({
  profilePictureUrl,
  displayName,
  wrapperClassName,
}: {
  profilePictureUrl: string | null | undefined;
  displayName: string;
  wrapperClassName: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <div className={wrapperClassName}>
      {profilePictureUrl && !imageFailed ? (
        <img
          src={profilePictureUrl}
          alt={`Avatar for ${displayName}`}
          className="size-full rounded-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <UserCircle2 size={24} className="text-white/80" />
      )}
    </div>
  );
}

const DESKTOP_ROW_GRID =
  "grid grid-cols-[2.5rem_minmax(0,1fr)_11.25rem_13.75rem] items-center gap-x-3";

type SortableHandleProps = Pick<
  ReturnType<typeof useSortable>,
  "attributes" | "listeners" | "setActivatorNodeRef"
>;

function sortableRowMotionStyle(
  transform: Transform | null,
  transition: string | undefined,
  isDragging: boolean
): CSSProperties {
  if (isDragging) {
    return { opacity: 0.35, transition };
  }

  return {
    transform: CSS.Transform.toString(transform),
    transition,
  };
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
  onRemoveParticipant: (id: string) => void;
  compact?: boolean;
}

function ParticipantRowActions({
  participant,
  displayName,
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

interface ParticipantsMobileRowContentProps {
  participant: ScheduleParticipantRow;
  dragHandleProps?: SortableHandleProps;
  onRemoveParticipant?: (id: string) => void;
}

function ParticipantsMobileRowContent({
  participant,
  dragHandleProps,
  onRemoveParticipant,
}: ParticipantsMobileRowContentProps) {
  const { t } = useTranslation();
  const displayName = participant.alias ?? participant.name ?? t("tournaments.unknownPlayer");

  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#010a04]/10 bg-[#010a04]/[0.04] px-[15px] py-3 last:border-b-0">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {dragHandleProps ? (
          <button
            ref={dragHandleProps.setActivatorNodeRef}
            {...dragHandleProps.attributes}
            {...dragHandleProps.listeners}
            type="button"
            className="touch-none text-[#010a04]/45 transition-colors cursor-grab hover:text-[#010a04]/70 active:cursor-grabbing"
            aria-label={t("tournaments.scheduleDragParticipantWithName", {
              name: displayName,
            })}
          >
            <DragDropVerticalIcon size={18} />
          </button>
        ) : (
          <span className="w-[18px] shrink-0" aria-hidden />
        )}
        <span
          className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${participantToneClass(
            participant
          )} text-[11px] font-semibold text-[#010a04]/80`}
        >
          <ScheduleParticipantAvatar
            profilePictureUrl={participant.profilePictureUrl}
            displayName={displayName}
            wrapperClassName="contents"
          />
        </span>
        <div className="min-w-0">
          <PlayerNameText name={displayName} className="text-[14px] font-medium text-[#010a04]" focusable />
          <p className="mt-0.5 truncate text-[12px] text-[#010a04]/60">
            {glickoSkillLevel(participant)}
          </p>
        </div>
      </div>

      {onRemoveParticipant ? (
        <ParticipantRowActions
          participant={participant}
          displayName={displayName}
          onRemoveParticipant={onRemoveParticipant}
          compact
        />
      ) : null}
    </div>
  );
}

interface SortableParticipantsMobileRowProps {
  participant: ScheduleParticipantRow;
  onRemoveParticipant: (id: string) => void;
}

function SortableParticipantsMobileRow({
  participant,
  onRemoveParticipant,
}: SortableParticipantsMobileRowProps) {
  const { attributes, listeners, setActivatorNodeRef, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: participant.id });

  return (
    <div
      ref={setNodeRef}
      className={cn(isDragging && "relative z-0")}
      style={sortableRowMotionStyle(transform, transition, isDragging)}
    >
      <ParticipantsMobileRowContent
        participant={participant}
        dragHandleProps={{ setActivatorNodeRef, attributes, listeners }}
        onRemoveParticipant={onRemoveParticipant}
      />
    </div>
  );
}

interface SortableParticipantsDesktopRowProps {
  participant: ScheduleParticipantRow;
  index: number;
  onRemoveParticipant: (id: string) => void;
}

interface ParticipantsDesktopRowContentProps {
  participant: ScheduleParticipantRow;
  index: number;
  dragHandleProps?: SortableHandleProps;
  onRemoveParticipant?: (id: string) => void;
  overlay?: boolean;
}

function ParticipantsDesktopRowContent({
  participant,
  index,
  dragHandleProps,
  onRemoveParticipant,
  overlay = false,
}: ParticipantsDesktopRowContentProps) {
  const { t } = useTranslation();
  const displayName = participant.alias ?? participant.name ?? t("tournaments.unknownPlayer");

  return (
    <div
      className={cn(
        DESKTOP_ROW_GRID,
        "border-b border-[#010a04]/10 bg-[#010a04]/[0.04] px-4 py-3 last:border-b-0",
        overlay && "rounded-[10px] border border-[rgba(0,0,0,0.12)] bg-white shadow-[0_8px_24px_rgba(1,10,4,0.12)]"
      )}
    >
      <span className="text-[13px] text-[#010a04]/75">{index + 1}</span>
      <div className="flex min-w-0 items-center gap-2.5">
        {dragHandleProps ? (
          <button
            ref={dragHandleProps.setActivatorNodeRef}
            {...dragHandleProps.attributes}
            {...dragHandleProps.listeners}
            type="button"
            className="touch-none text-[#010a04]/45 transition-colors cursor-grab hover:text-[#010a04]/70 active:cursor-grabbing"
            aria-label={t("tournaments.scheduleDragParticipantWithName", {
              name: displayName,
            })}
          >
            <DragDropVerticalIcon size={16} />
          </button>
        ) : (
          <span className="w-4 shrink-0" aria-hidden />
        )}
        <span
          className={`flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${participantToneClass(
            participant
          )} text-[9px] font-semibold text-[#010a04]/80`}
        >
          <ScheduleParticipantAvatar
            profilePictureUrl={participant.profilePictureUrl}
            displayName={displayName}
            wrapperClassName="contents"
          />
        </span>
        <PlayerNameText name={displayName} className="min-w-0 text-[14px] text-[#010a04]" focusable />
      </div>
      <span className="text-[14px] text-[#010a04]/85">{glickoSkillLevel(participant)}</span>
      {onRemoveParticipant ? (
        <ParticipantRowActions
          participant={participant}
          displayName={displayName}
          onRemoveParticipant={onRemoveParticipant}
        />
      ) : (
        <span />
      )}
    </div>
  );
}

function SortableParticipantsDesktopRow({
  participant,
  index,
  onRemoveParticipant,
}: SortableParticipantsDesktopRowProps) {
  const { attributes, listeners, setActivatorNodeRef, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: participant.id });

  return (
    <div
      ref={setNodeRef}
      className={cn(isDragging && "relative z-0")}
      style={sortableRowMotionStyle(transform, transition, isDragging)}
    >
      <ParticipantsDesktopRowContent
        participant={participant}
        index={index}
        dragHandleProps={{ setActivatorNodeRef, attributes, listeners }}
        onRemoveParticipant={onRemoveParticipant}
      />
    </div>
  );
}

export function ScheduleParticipantsTable({
  mode,
  participants,
  doublesPairs,
  doublesPairsLoading = false,
  onRemoveParticipant,
  onReorderParticipant,
}: ScheduleParticipantsTableProps) {
  const { t } = useTranslation();
  const usesCustomListOrder = useMemo(() => hasCustomSchedulingOrder(participants), [participants]);
  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  const participantIds: UniqueIdentifier[] = participants.map((participant) => participant.id);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const activeDragParticipant = useMemo(
    () => participants.find((participant) => participant.id === activeDragId) ?? null,
    [activeDragId, participants]
  );
  const activeDragIndex = activeDragParticipant
    ? participants.findIndex((participant) => participant.id === activeDragParticipant.id)
    : -1;

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveDragId(String(active.id));
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveDragId(null);
    if (!over || active.id === over.id) {
      return;
    }

    onReorderParticipant(String(active.id), String(over.id));
  };

  const handleDragCancel = () => {
    setActiveDragId(null);
  };

  const dndModifiers = [restrictToVerticalAxis];

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
    const renderDoublesPlayerRow = (
      player: (typeof doublesRows)[number]["players"][number] | null
    ) => {
      if (!player) {
        return null;
      }
      const displayName = player.alias ?? player.name ?? t("tournaments.unknownPlayer");
      return (
        <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <DoublesPairPlayerAvatar
              profilePictureUrl={player.profilePictureUrl}
              displayName={displayName}
              wrapperClassName={`flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${participantToneClass(
                player
              )}`}
            />
            <span className="block truncate text-[14px] font-medium text-[#010a04]">
              {displayName}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemoveParticipant(player.id)}
            className="h-7 w-7 shrink-0 px-0 text-[#d92100] hover:bg-[#d92100]/10"
            aria-label={t("tournaments.removeParticipant", { name: displayName })}
          >
            <Delete01Icon size={15} />
          </Button>
        </div>
      );
    };

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
                <div className="flex flex-col gap-3">
                  {renderDoublesPlayerRow(firstPlayer)}
                  {secondPlayer ? (
                    <>
                      <span className="text-center text-[12px] font-medium text-[#010a04]/40">+</span>
                      {renderDoublesPlayerRow(secondPlayer)}
                    </>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
        {doublesPairs.unpaired.length > 0 ? (
          <div className="space-y-2 rounded-[10px] border border-[rgba(0,0,0,0.08)] px-[15px] py-3">
            <p className="text-[12px] font-medium uppercase text-[#010a04]/70">
              {t("tournaments.scheduleDoublesUnpaired")}
            </p>
            {doublesPairs.unpaired.map((player) => (
              <div key={player.id}>{renderDoublesPlayerRow(player)}</div>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  const mobileSinglesRows = (
    <div className="md:hidden">
      <DndContext
        collisionDetection={closestCenter}
        modifiers={dndModifiers}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        sensors={sensors}
      >
        <SortableContext items={participantIds} strategy={verticalListSortingStrategy}>
          <div className="overflow-hidden rounded-[10px] border border-[rgba(0,0,0,0.08)]">
            {participants.map((participant) => (
              <SortableParticipantsMobileRow
                key={participant.id}
                participant={participant}
                onRemoveParticipant={onRemoveParticipant}
              />
            ))}
          </div>
        </SortableContext>
        <DragOverlay dropAnimation={null}>
          {activeDragParticipant ? (
            <div className="rounded-[10px] border border-[rgba(0,0,0,0.12)] bg-white shadow-[0_8px_24px_rgba(1,10,4,0.12)]">
              <ParticipantsMobileRowContent
                participant={activeDragParticipant}
                onRemoveParticipant={onRemoveParticipant}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );

  return (
    <>
      {usesCustomListOrder ? (
        <p className="mb-3 text-[12px] leading-relaxed text-[#010a04]/60 md:mb-4">
          {t("tournaments.scheduleCustomOrderHint")}
        </p>
      ) : null}
      {mobileSinglesRows}

      <div className="hidden md:block">
        <DndContext
          collisionDetection={closestCenter}
          modifiers={dndModifiers}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
          sensors={sensors}
        >
          <div className="overflow-hidden rounded-[10px] border border-[rgba(0,0,0,0.08)]">
            <div
              className={cn(
                DESKTOP_ROW_GRID,
                "border-b border-[#010a04]/10 bg-[#010a04]/[0.04] px-4 py-2 text-[12px] font-normal text-[#010a04]/70"
              )}
            >
              <span>#</span>
              <span>{t("tournaments.players")}</span>
              <span>{t("tournaments.skillLevel")}</span>
              <span>{t("tournaments.actions")}</span>
            </div>
            <SortableContext items={participantIds} strategy={verticalListSortingStrategy}>
              {participants.map((participant, index) => (
                <SortableParticipantsDesktopRow
                  key={participant.id}
                  participant={participant}
                  index={index}
                  onRemoveParticipant={onRemoveParticipant}
                />
              ))}
            </SortableContext>
          </div>
          <DragOverlay dropAnimation={null}>
            {activeDragParticipant && activeDragIndex >= 0 ? (
              <ParticipantsDesktopRowContent
                participant={activeDragParticipant}
                index={activeDragIndex}
                onRemoveParticipant={onRemoveParticipant}
                overlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </>
  );
}
