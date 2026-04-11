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
  PencilEdit01Icon,
  Delete01Icon,
} from "@/icons/figma-icons";
import type {
  GenerateTournamentDoublesPairsResponse,
  TournamentScheduleMode,
} from "@/models/tournament/types";
import type { ScheduleParticipantRow } from "./helpers";

interface ScheduleParticipantsTableProps {
  mode: TournamentScheduleMode;
  participants: ScheduleParticipantRow[];
  doublesPairs: GenerateTournamentDoublesPairsResponse | null;
  onRemoveParticipant: (id: string) => void;
  onMoveParticipant: (index: number, direction: "up" | "down") => void;
  onEditParticipant: () => void;
}

export function ScheduleParticipantsTable({
  mode,
  participants,
  doublesPairs,
  onRemoveParticipant,
  onMoveParticipant,
  onEditParticipant,
}: ScheduleParticipantsTableProps) {
  const doublesRows =
    mode === "doubles"
      ? doublesPairs?.teams.map((team) => ({
          id: `team-${team.team}`,
          label: `${team.players[0].name} / ${team.players[1].name}`,
          skillLabel: "glicko2",
        })) ?? []
      : [];

  const showSingles = mode === "singles" || !doublesPairs;

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-[#010a04]/[0.04] hover:bg-[#010a04]/[0.04]">
          <TableHead className="w-10 text-[12px] font-normal text-[#010a04]/70">#</TableHead>
          <TableHead className="text-[12px] font-normal text-[#010a04]/70">Players</TableHead>
          <TableHead className="w-[180px] text-[12px] font-normal text-[#010a04]/70">Skill Level</TableHead>
          <TableHead className="w-[220px] text-[12px] font-normal text-[#010a04]/70">Actions</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {showSingles
          ? participants.map((participant, index) => (
              <TableRow key={participant.id}>
                <TableCell className="text-[13px] text-[#010a04]/75">{index + 1}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <span className="h-[18px] w-[18px] rounded-full bg-[#d9d9d9]" />
                    <span className="text-[14px] text-[#010a04]">{participant.name}</span>
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
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveParticipant(participant.id)}
                      className="h-7 px-2 text-[12px] text-[#d92100] hover:bg-[#d92100]/10"
                    >
                      <Delete01Icon size={14} className="mr-1" />
                      Remove
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
            ))
          : doublesRows.map((teamRow, index) => (
              <TableRow key={teamRow.id}>
                <TableCell className="text-[13px] text-[#010a04]/75">{index + 1}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <span className="h-[18px] w-[18px] rounded-full bg-[#d9d9d9]" />
                    <span className="text-[14px] text-[#010a04]">{teamRow.label}</span>
                  </div>
                </TableCell>
                <TableCell className="text-[14px] text-[#010a04]/85">{teamRow.skillLabel}</TableCell>
                <TableCell className="text-[12px] text-[#6a6a6a]">Pairs generated from current order</TableCell>
              </TableRow>
            ))}
      </TableBody>
    </Table>
  );
}
