import type {
  BackendCreateTournamentInput,
  BackendTournamentDetail,
  BackendUpdateTournamentInput,
  CreateTournamentInput,
  TournamentDetail,
  UpdateTournamentInput,
} from "@/models/tournament/types";
import {
  backendCreateTournamentInputSchema,
  backendUpdateTournamentInputSchema,
  backendTournamentDetailSchema,
} from "@/models/tournament/types";
export function mapBackendTournamentDetail(data: BackendTournamentDetail): TournamentDetail {
  return backendTournamentDetailSchema.parse({
    ...data,
  });
}

export function toBackendCreateInput(data: CreateTournamentInput): BackendCreateTournamentInput {
  const sponsorTrimmed = data.sponsor?.trim();
  return backendCreateTournamentInputSchema.parse({
    club: data.club,
    name: data.name,
    status: data.status,
    sponsor: sponsorTrimmed !== "" ? sponsorTrimmed : undefined,
    date: data.date ?? undefined,
    startTime: data.startTime ?? undefined,
    endTime: data.endTime ?? undefined,
    playMode: data.playMode,
    tournamentMode: data.tournamentMode,
    entryFee: data.entryFee,
    minMember: data.minMember,
    maxMember: data.maxMember,
    totalRounds: data.totalRounds,
    duration: data.duration ?? undefined,
    breakDuration: data.breakDuration ?? undefined,
    foodInfo: data.foodInfo,
    descriptionInfo: data.descriptionInfo,
  });
}

export function toBackendUpdateInput(data: UpdateTournamentInput): BackendUpdateTournamentInput {
  const sponsorTrimmed = typeof data.sponsor === "string" ? data.sponsor.trim() : undefined;
  const payload = {
    club: data.club,
    status: data.status,
    sponsor:
      data.sponsor === null
        ? null
        : sponsorTrimmed !== ""
          ? sponsorTrimmed
          : undefined,
    name: data.name,
    date: data.date,
    startTime: data.startTime,
    endTime: data.endTime,
    playMode: data.playMode,
    tournamentMode: data.tournamentMode,
    entryFee: data.entryFee,
    minMember: data.minMember,
    maxMember: data.maxMember,
    totalRounds: data.totalRounds,
    duration: data.duration,
    breakDuration: data.breakDuration,
    foodInfo: data.foodInfo,
    descriptionInfo: data.descriptionInfo,
  };

  const sanitizedPayload = Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  );

  return backendUpdateTournamentInputSchema.parse(sanitizedPayload);
}
