import type {
  TournamentScheduleMode,
  TournamentScheduleParticipant,
} from "@/models/tournament/types";

export interface ScheduleParticipantRow extends TournamentScheduleParticipant {
  order: number;
}

export function normalizeParticipantRows(
  participants: TournamentScheduleParticipant[]
): ScheduleParticipantRow[] {
  return [...participants]
    .sort((a, b) => {
      const aOrder = Number.isFinite(a.order) ? a.order : Number.POSITIVE_INFINITY;
      const bOrder = Number.isFinite(b.order) ? b.order : Number.POSITIVE_INFINITY;
      return aOrder - bOrder;
    })
    .map((participant, index) => ({
      ...participant,
      order: index + 1,
    }));
}

export function moveParticipant(
  rows: ScheduleParticipantRow[],
  index: number,
  direction: "up" | "down"
): ScheduleParticipantRow[] {
  if (rows.length < 2 || index < 0 || index >= rows.length) {
    return rows;
  }

  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= rows.length) {
    return rows;
  }

  const nextRows = [...rows];
  const [current] = nextRows.splice(index, 1);
  nextRows.splice(targetIndex, 0, current);

  return nextRows.map((participant, orderIndex) => ({
    ...participant,
    order: orderIndex + 1,
  }));
}

export function reorderParticipantsById(
  rows: ScheduleParticipantRow[],
  activeId: string,
  overId: string
): ScheduleParticipantRow[] {
  if (rows.length < 2 || activeId === overId) {
    return rows;
  }

  const sourceIndex = rows.findIndex((participant) => participant.id === activeId);
  const targetIndex = rows.findIndex((participant) => participant.id === overId);
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
    return rows;
  }

  const nextRows = [...rows];
  const [current] = nextRows.splice(sourceIndex, 1);
  nextRows.splice(targetIndex, 0, current);

  return nextRows.map((participant, orderIndex) => ({
    ...participant,
    order: orderIndex + 1,
  }));
}

export function removeParticipant(
  rows: ScheduleParticipantRow[],
  id: string
): ScheduleParticipantRow[] {
  return rows
    .filter((participant) => participant.id !== id)
    .map((participant, index) => ({
      ...participant,
      order: index + 1,
    }));
}

/** List rank sent to the server (matches # column / drag-and-drop order). */
export function participantOrderIds(rows: ScheduleParticipantRow[]): string[] {
  return [...rows]
    .sort((left, right) => left.order - right.order)
    .map((participant) => participant.id);
}

/** True when list order differs from descending real rating order. */
export function hasCustomSchedulingOrder(rows: ScheduleParticipantRow[]): boolean {
  if (rows.length < 2) {
    return false;
  }

  const originalIndexById = new Map(rows.map((participant, index) => [participant.id, index]));
  const ratingSortedIds = [...rows]
    .sort((left, right) => {
      const leftRating = Number.isFinite(left.rating) ? left.rating : 1500;
      const rightRating = Number.isFinite(right.rating) ? right.rating : 1500;
      if (leftRating !== rightRating) {
        return rightRating - leftRating;
      }

      return (originalIndexById.get(left.id) ?? 0) - (originalIndexById.get(right.id) ?? 0);
    })
    .map((participant) => participant.id);

  const currentOrder = participantOrderIds(rows);
  return currentOrder.some((id, index) => id !== ratingSortedIds[index]);
}

export function canGenerateSchedule(mode: TournamentScheduleMode, participantsCount: number): boolean {
  if (mode === "singles") {
    return participantsCount >= 2;
  }

  return participantsCount >= 4;
}

function playersPerMatch(mode: TournamentScheduleMode): number {
  return mode === "doubles" ? 4 : 2;
}

/**
 * Maximum simultaneous matches that can run without assigning a participant to multiple courts.
 */
export function maxConcurrentMatchesForParticipants(
  mode: TournamentScheduleMode,
  participantsCount: number
): number {
  const perMatch = playersPerMatch(mode);
  return Math.max(0, Math.floor(participantsCount / perMatch));
}

/**
 * Caps selected courts to feasible participant concurrency for the chosen mode.
 */
export function capCourtsForParticipants(
  selectedCourtIds: string[],
  mode: TournamentScheduleMode,
  participantsCount: number
): string[] {
  const maxConcurrent = maxConcurrentMatchesForParticipants(mode, participantsCount);
  if (maxConcurrent <= 0) {
    return [];
  }
  return selectedCourtIds.slice(0, maxConcurrent);
}
