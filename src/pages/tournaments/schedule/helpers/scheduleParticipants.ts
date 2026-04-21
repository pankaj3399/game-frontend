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

export function participantOrderIds(rows: ScheduleParticipantRow[]): string[] {
  return rows.map((participant) => participant.id);
}

export function canGenerateSchedule(mode: TournamentScheduleMode, participantsCount: number): boolean {
  if (mode === "singles") {
    return participantsCount >= 2;
  }

  return participantsCount >= 4;
}
