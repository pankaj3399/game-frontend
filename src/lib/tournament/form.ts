import type { CreateTournamentInput, TournamentDetail } from "@/models/tournament/types";
import {
  DEFAULT_TOURNAMENT_BREAK_DURATION,
  DEFAULT_TOURNAMENT_DURATION,
} from "@/constants/tournament";
import {
  getTodayDateInputValue,
  normalizeDateToUtcIsoString,
  normalizeIsoDateInputValue,
} from "@/utils/date";
import { normalizeTimeTo24Hour } from "@/utils/time";

export type TournamentValidationErrorKey =
  | "tournaments.requiredNameAndClub"
  | "tournaments.requiredDateAndTime"
  | "tournaments.invalidTimeRange"
  | "tournaments.invalidMemberRange";

export const DEFAULT_CREATE_TOURNAMENT_FORM: CreateTournamentInput = {
  club: "",
  name: "",
  status: "draft",
  sponsor: null,
  date: getTodayDateInputValue(),
  startTime: "05:00",
  endTime: "21:00",
  playMode: "1set",
  tournamentMode: "singleDay",
  entryFee: 0,
  minMember: 5,
  maxMember: 8,
  duration: DEFAULT_TOURNAMENT_DURATION,
  breakDuration: DEFAULT_TOURNAMENT_BREAK_DURATION,
  foodInfo: "",
  descriptionInfo: "",
};

export function mapTournamentDetailToForm(tournament: TournamentDetail): CreateTournamentInput {
  return {
    club: tournament.club?.id ?? "",
    name: tournament.name ?? "",
    status: "draft",
    sponsor: tournament.sponsor?.id ?? null,
    logo: tournament.logo ?? null,
    date: normalizeIsoDateInputValue(tournament.date),
    startTime: tournament.startTime ?? null,
    endTime: tournament.endTime ?? null,
    playMode: tournament.playMode,
    tournamentMode: tournament.tournamentMode ,
    entryFee: tournament.entryFee,
    minMember: tournament.minMember,
    maxMember: tournament.maxMember,
    duration: tournament.duration,
    breakDuration: tournament.breakDuration,
    courts: tournament.courts?.map((court) => court.id) ?? [],
    foodInfo: tournament.foodInfo ?? "",
    descriptionInfo: tournament.descriptionInfo ?? "",
  };
}

export function buildTournamentPayload(
  form: CreateTournamentInput,
  status: "draft" | "active"
): CreateTournamentInput {
  return {
    ...form,
    status,
    club: form.club,
    name: form.name.trim(),
    date: normalizeDateToUtcIsoString(form.date),
    startTime: normalizeTimeTo24Hour(form.startTime ?? null),
    endTime: normalizeTimeTo24Hour(form.endTime ?? null),
    sponsor: form.sponsor || null,
    foodInfo: form.foodInfo ?? "",
    descriptionInfo: form.descriptionInfo ?? "",
    entryFee: Number(form.entryFee) || 0,
    minMember: Number(form.minMember) || 1,
    maxMember: Number(form.maxMember) || 1,
  };
}

export function buildDraftUpdatePayload(form: CreateTournamentInput): Omit<CreateTournamentInput, "status"> {
  const payload = buildTournamentPayload(form, "draft");
  return {
    club: payload.club,
    name: payload.name,
    sponsor: payload.sponsor,
    logo: payload.logo,
    date: payload.date,
    startTime: payload.startTime,
    endTime: payload.endTime,
    playMode: payload.playMode,
    tournamentMode: payload.tournamentMode,
    entryFee: payload.entryFee,
    minMember: payload.minMember,
    maxMember: payload.maxMember,
    duration: payload.duration,
    breakDuration: payload.breakDuration,
    courts: payload.courts,
    foodInfo: payload.foodInfo,
    descriptionInfo: payload.descriptionInfo,
  };
}

function invalidMemberRangeKey(form: CreateTournamentInput): TournamentValidationErrorKey | null {
  if (form.minMember && form.maxMember && form.minMember > form.maxMember) {
    return "tournaments.invalidMemberRange";
  }
  return null;
}

export function getDraftValidationError(form: CreateTournamentInput): TournamentValidationErrorKey | null {
  if (!form.club || !form.name.trim()) {
    return "tournaments.requiredNameAndClub";
  }
  return invalidMemberRangeKey(form);
}

export function getPublishValidationError(form: CreateTournamentInput): TournamentValidationErrorKey | null {
  if (!form.club || !form.name.trim()) {
    return "tournaments.requiredNameAndClub";
  }
  if (form.tournamentMode === "singleDay" && (!form.date || !form.startTime || !form.endTime)) {
    return "tournaments.requiredDateAndTime";
  }
  if (form.tournamentMode === "singleDay" && form.date && form.startTime && form.endTime) {
    const normStart = normalizeTimeTo24Hour(form.startTime);
    const normEnd = normalizeTimeTo24Hour(form.endTime);
    if (normStart === null || normEnd === null || normEnd <= normStart) {
      return "tournaments.invalidTimeRange";
    }
  }
  return invalidMemberRangeKey(form);
}
