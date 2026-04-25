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
  | "tournaments.invalidMemberRange"
  | "tournaments.invalidTotalRoundsRange";

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
  totalRounds: 1,
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
    date: normalizeIsoDateInputValue(tournament.date),
    startTime: tournament.startTime ?? null,
    endTime: tournament.endTime ?? null,
    playMode: tournament.playMode,
    tournamentMode: tournament.tournamentMode ,
    entryFee: tournament.entryFee,
    minMember: tournament.minMember,
    maxMember: tournament.maxMember,
    totalRounds: tournament.totalRounds,
    duration: tournament.duration ?? DEFAULT_TOURNAMENT_DURATION,
    breakDuration: tournament.breakDuration ?? DEFAULT_TOURNAMENT_BREAK_DURATION,
    foodInfo: tournament.foodInfo ?? "",
    descriptionInfo: tournament.descriptionInfo ?? "",
  };
}

export function buildTournamentPayload(
  form: CreateTournamentInput,
  status: "draft" | "active"
): CreateTournamentInput {
  const minMember = Math.max(1, Math.floor(Number(form.minMember) || 1));
  const maxMember = Math.max(1, Math.floor(Number(form.maxMember) || 1));
  const totalRounds = Math.max(
    1,
    Math.min(100, Math.floor(Number(form.totalRounds) || 1))
  );

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
    minMember: Math.min(minMember, maxMember),
    maxMember: Math.max(minMember, maxMember),
    totalRounds,
    duration: form.duration,
    breakDuration: form.breakDuration,
  };
}

export function buildUpdatePayload(form: CreateTournamentInput): Omit<CreateTournamentInput, "status"> {
  return buildChangedUpdatePayload(form, null) as Omit<CreateTournamentInput, "status">;
}

const UPDATE_PAYLOAD_FIELDS = [
  "club",
  "name",
  "sponsor",
  "date",
  "startTime",
  "endTime",
  "playMode",
  "tournamentMode",
  "entryFee",
  "minMember",
  "maxMember",
  "totalRounds",
  "duration",
  "breakDuration",
  "foodInfo",
  "descriptionInfo",
] as const;

type UpdatePayloadField = (typeof UPDATE_PAYLOAD_FIELDS)[number];
type UpdatePayloadBody = Omit<CreateTournamentInput, "status">;

function pickUpdatePayloadFields(payload: CreateTournamentInput): UpdatePayloadBody {
  return UPDATE_PAYLOAD_FIELDS.reduce<Partial<UpdatePayloadBody>>((acc, field) => {
    const key = field as UpdatePayloadField;
    (acc as Record<UpdatePayloadField, UpdatePayloadBody[UpdatePayloadField]>)[key] =
      payload[key];
    return acc;
  }, {}) as UpdatePayloadBody;
}

/**
 * Builds a PATCH payload containing only fields that differ from the baseline.
 * If no baseline is provided, returns all editable update fields.
 */
export function buildChangedUpdatePayload(
  form: CreateTournamentInput,
  baselineForm: CreateTournamentInput | null
): Partial<UpdatePayloadBody> {
  const normalizedCurrent = pickUpdatePayloadFields(buildTournamentPayload(form, "draft"));

  if (baselineForm == null) {
    return normalizedCurrent;
  }

  const normalizedBaseline = pickUpdatePayloadFields(
    buildTournamentPayload(baselineForm, "draft")
  );

  return UPDATE_PAYLOAD_FIELDS.reduce<Partial<UpdatePayloadBody>>((acc, field) => {
    const key = field as UpdatePayloadField;
    const currentValue = normalizedCurrent[key];
    const baselineValue = normalizedBaseline[key];

    if (currentValue !== baselineValue) {
      (acc as Record<UpdatePayloadField, UpdatePayloadBody[UpdatePayloadField]>)[key] =
        currentValue;
    }
    return acc;
  }, {});
}

export function getMemberRangeErrorKey(
  form: CreateTournamentInput
): "tournaments.invalidMemberRange" | null {
  if (
    form.minMember != null &&
    form.maxMember != null &&
    form.minMember > form.maxMember
  ) {
    return "tournaments.invalidMemberRange";
  }
  return null;
}

export function getTotalRoundsErrorKey(
  form: CreateTournamentInput
): "tournaments.invalidTotalRoundsRange" | null {
  if (!Number.isFinite(form.totalRounds)) {
    return "tournaments.invalidTotalRoundsRange";
  }

  const rounds = Math.floor(form.totalRounds);
  if (rounds < 1 || rounds > 100) {
    return "tournaments.invalidTotalRoundsRange";
  }

  return null;
}

/** When set, scheduled single-day times are missing or end is not after start. */
export function getScheduledTimeRangeErrorKey(
  form: CreateTournamentInput
): "tournaments.invalidTimeRange" | null {
  if (form.tournamentMode !== "singleDay") return null;
  if (!form.date || !form.startTime || !form.endTime) return null;
  const normStart = normalizeTimeTo24Hour(form.startTime);
  const normEnd = normalizeTimeTo24Hour(form.endTime);
  if (normStart === null || normEnd === null || normEnd <= normStart) {
    return "tournaments.invalidTimeRange";
  }
  return null;
}

export function getDraftValidationError(form: CreateTournamentInput): TournamentValidationErrorKey | null {
  if (!form.club || !form.name.trim()) {
    return "tournaments.requiredNameAndClub";
  }
  const roundsErr = getTotalRoundsErrorKey(form);
  if (roundsErr) return roundsErr;
  const timeRangeErr = getScheduledTimeRangeErrorKey(form);
  if (timeRangeErr) return timeRangeErr;
  return getMemberRangeErrorKey(form);
}

export function getPublishValidationError(form: CreateTournamentInput): TournamentValidationErrorKey | null {
  if (!form.club || !form.name.trim()) {
    return "tournaments.requiredNameAndClub";
  }
  const roundsErr = getTotalRoundsErrorKey(form);
  if (roundsErr) return roundsErr;
  if (form.tournamentMode === "singleDay" && (!form.date || !form.startTime || !form.endTime)) {
    return "tournaments.requiredDateAndTime";
  }
  const timeRangeErr = getScheduledTimeRangeErrorKey(form);
  if (timeRangeErr) return timeRangeErr;
  return getMemberRangeErrorKey(form);
}
