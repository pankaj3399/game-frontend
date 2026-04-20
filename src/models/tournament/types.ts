import { z } from "zod";

/**
 * JSON often omits keys where we want a single absent representation. After parse,
 * optional omission becomes `null` (never `undefined` on inferred types).
 */
export function wireJsonNullableString() {
  return z.preprocess(
    (val: unknown) => (val === undefined ? null : val),
    z.union([z.string(), z.null()])
  );
}

export function wireJsonNullableNumber() {
  return z.preprocess(
    (val: unknown) => {
      if (val === undefined) return null;
      if (val === null) return null;
      if (typeof val === "number" && Number.isFinite(val)) return val;
      if (typeof val === "string" && val.trim() !== "") {
        const n = Number(val);
        if (Number.isFinite(n)) return n;
      }
      return val;
    },
    z.union([z.number(), z.null()])
  );
}

export function wireJsonNullable<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess(
    (val: unknown) => (val === undefined ? null : val),
    z.union([schema, z.null()])
  );
}

export const tournamentStatusSchema = z.enum(["active", "draft"]);
export const tournamentModeSchema = z.enum(["singleDay", "unscheduled"]);
export const tournamentPlayModeSchema = z.enum(["TieBreak10", "1set", "3setTieBreak10", "3set", "5set"]);
export const tournamentListViewSchema = z.enum(["published", "drafts"]);
export const tournamentWhenFilterSchema = z.enum(["future", "past"]);
export const tournamentDistanceFilterSchema = z.enum(["under50", "between50And80", "over80"]);

export type TournamentStatus = z.infer<typeof tournamentStatusSchema>;
export type TournamentMode = z.infer<typeof tournamentModeSchema>;
export type TournamentPlayMode = z.infer<typeof tournamentPlayModeSchema>;
export type TournamentListView = z.infer<typeof tournamentListViewSchema>;
export type TournamentWhenFilter = z.infer<typeof tournamentWhenFilterSchema>;
export type TournamentDistanceFilter = z.infer<typeof tournamentDistanceFilterSchema>;

export const tournamentClubSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: wireJsonNullableString(),
});

export const tournamentSponsorSchema = z.object({
  id: z.string(),
  name: z.string(),
  logoUrl: wireJsonNullableString(),
  link: wireJsonNullableString(),
});

export const tournamentCourtSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string().nullable(),
  placement: z.string().nullable(),
});

export const tournamentParticipantSchema = z.object({
  id: z.string(),
  name: wireJsonNullableString(),
  alias: wireJsonNullableString(),
});

export const tournamentProgressSchema = z.object({
  spotsFilled: z.number(),
  spotsTotal: z.number(),
  percentage: z.number(),
});

export const tournamentPermissionsSchema = z.object({
  canEdit: z.boolean(),
  canJoin: z.boolean(),
  canLeave: z.boolean(),
  isParticipant: z.boolean(),
});

export const tournamentMatchStatusSchema = z.enum(["completed", "inProgress", "pendingScore", "scheduled", "cancelled"]);
export const tournamentScheduleModeSchema = z.enum(["singles", "doubles"]);

export const tournamentMatchPlayerSchema = tournamentParticipantSchema
  .pick({
    id: true,
    name: true,
    alias: true,
  })
  .extend({
    elo: wireJsonNullable(
      z.object({
        rating: wireJsonNullableNumber(),
        rd: wireJsonNullableNumber(),
      })
    ),
  });

export const tournamentMatchSideSchema = z.tuple([
  tournamentMatchPlayerSchema.nullable(),
  tournamentMatchPlayerSchema.nullable(),
]);

export const tournamentMatchCourtSchema = z.object({
  id: wireJsonNullableString(),
  name: wireJsonNullableString(),
  number: z.number().int().optional(),
});

export const tournamentMatchScoreValueSchema = z.union([
  z.number().int().min(0),
  z.literal("wo"),
]);

export const tournamentMatchScoreSchema = z.object({
  playerOneScores: z.array(tournamentMatchScoreValueSchema),
  playerTwoScores: z.array(tournamentMatchScoreValueSchema),
});

export const tournamentLiveMatchItemSchema = z.object({
  id: z.string(),
  mode: tournamentScheduleModeSchema,
  status: tournamentMatchStatusSchema,
  startTime: z.string().nullable(),
  tournament: z.object({
    id: wireJsonNullableString(),
    name: z.string(),
  }),
  court: tournamentMatchCourtSchema,
  myTeam: z.array(tournamentMatchPlayerSchema),
  opponentTeam: z.array(tournamentMatchPlayerSchema),
});

export const tournamentLiveMatchResponseSchema = z.object({
  liveMatch: tournamentLiveMatchItemSchema.nullable(),
  nextMatch: tournamentLiveMatchItemSchema.nullable(),
});

export const recordTournamentMatchScoreInputSchema = z
  .object({
    playerOneScores: z.array(tournamentMatchScoreValueSchema).min(1).max(25),
    playerTwoScores: z.array(tournamentMatchScoreValueSchema).min(1).max(25),
  })
  .refine((value) => value.playerOneScores.length === value.playerTwoScores.length, {
    message: "playerOneScores and playerTwoScores must have the same number of sets",
    path: ["playerTwoScores"],
  });

export const recordTournamentMatchScoreResponseSchema = z.object({
  message: z.string(),
  match: z.object({
    id: z.string(),
    tournamentId: z.string(),
    status: z.enum(["completed", "pendingScore"]),
  }),
  tournamentCompleted: z.boolean(),
  ratings: z.array(
    z.object({
      userId: z.string(),
      rating: z.number(),
      rd: z.number(),
      vol: z.number(),
    })
  ),
});

export const tournamentScheduleMatchSchema = z.object({
  id: z.string(),
  round: z.number().int().min(1),
  slot: z.number().int().min(1),
  mode: tournamentScheduleModeSchema.optional(),
  playMode: tournamentPlayModeSchema,
  status: tournamentMatchStatusSchema,
  startTime: z.string().nullable(),
  score: tournamentMatchScoreSchema,
  court: tournamentMatchCourtSchema,
  players: z.tuple([
    tournamentMatchPlayerSchema.nullable(),
    tournamentMatchPlayerSchema.nullable(),
  ]),
  side1: tournamentMatchSideSchema,
  side2: tournamentMatchSideSchema,
});

export const tournamentScheduleInfoSchema = z.object({
  id: wireJsonNullableString(),
  status: wireJsonNullableString(),
  currentRound: z.number().int().min(0),
  totalRounds: z.number().int().min(0),
});

export const tournamentMatchesResponseSchema = z.object({
  schedule: tournamentScheduleInfoSchema,
  matches: z.array(tournamentScheduleMatchSchema),
});

export const tournamentScheduleInputSchema = z
  .object({
    matchDurationMinutes: z.number().int().min(5).optional(),
    breakTimeMinutes: z.number().int().min(0).optional(),
    matchesPerPlayer: z.number().int().min(1).max(20),
    startTime: z.string(),
    mode: tournamentScheduleModeSchema,
    availableCourts: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        selected: z.boolean(),
      })
    ),
  });

export const tournamentScheduleParticipantSchema = z.object({
  id: z.string(),
  name: wireJsonNullableString(),
  alias: wireJsonNullableString(),
  skillLabel: z.string(),
  rating: z.number(),
  rd: z.number().optional(),
  order: z.number().int().min(1),
});

export const tournamentScheduleResponseSchema = z.object({
  tournament: z.object({
    id: z.string(),
    name: z.string(),
  }),
  scheduleInput: tournamentScheduleInputSchema,
  participants: z.array(tournamentScheduleParticipantSchema),
  scheduleSummary: z.object({
    currentRound: z.number().int().min(0),
    totalRounds: z.number().int().min(0),
  }),
});

export const generateTournamentScheduleInputSchema = z.object({
  round: z.number().int().min(1),
  mode: tournamentScheduleModeSchema,
  matchDurationMinutes: z.number().int().min(5).max(240).optional(),
  breakTimeMinutes: z.number().int().min(0).max(120).optional(),
  matchesPerPlayer: z.number().int().min(1).max(20),
  startTime: z.string(),
  courtIds: z.array(z.string()).min(1),
  participantOrder: z.array(z.string()).min(2),
});

export const generateTournamentScheduleResponseSchema = z.object({
  message: z.string(),
  schedule: z.object({
    id: z.string(),
    round: z.number().int().min(1),
    currentRound: z.number().int().min(1),
    generatedMatches: z.number().int().min(1),
  }),
});

export const generateTournamentDoublesPairsInputSchema = z.object({
  participantOrder: z.array(z.string()).min(2),
});

export const tournamentSchedulePairPlayerSchema = z.object({
  id: z.string(),
  name: wireJsonNullableString(),
  alias: wireJsonNullableString(),
  skillLabel: z.string(),
  rating: z.number(),
});

export const generateTournamentDoublesPairsResponseSchema = z.object({
  teams: z.array(
    z.object({
      team: z.number().int().min(1),
      players: z.array(tournamentSchedulePairPlayerSchema).length(2),
    })
  ),
  unpaired: z.array(tournamentSchedulePairPlayerSchema),
});

const memberCountSchema = z.coerce.number().int().min(1);
const totalRoundsSchema = z.coerce.number().int().min(1).max(100);
const foodInfoSchema = z
  .string()
  .max(500, { message: "foodInfo must be at most 500 characters" });

function normalizeMemberRange<T extends { minMember: number; maxMember: number }>(value: T): T {
  const minMember = Math.min(value.minMember, value.maxMember);
  const maxMember = Math.max(value.minMember, value.maxMember);
  return { ...value, minMember, maxMember };
}

export const tournamentListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  club: wireJsonNullable(tournamentClubSchema),
  date: wireJsonNullableString(),
  status: tournamentStatusSchema,
  sponsor: wireJsonNullable(tournamentSponsorSchema),
});

export const tournamentListFiltersSchema = z.object({
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).optional(),
  q: z.string().optional(),
  view: tournamentListViewSchema.optional(),
  when: tournamentWhenFilterSchema.optional(),
  distance: tournamentDistanceFilterSchema.optional(),
  clubId: z.string().optional(),
});

export const tournamentPaginationSchema = z.object({
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export const tournamentsResponseSchema = z.object({
  tournaments: z.array(tournamentListItemSchema),
  pagination: tournamentPaginationSchema,
});

export const backendTournamentDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  club: wireJsonNullable(tournamentClubSchema),
  sponsor: wireJsonNullable(tournamentSponsorSchema),
  clubSponsors: z.array(tournamentSponsorSchema),
  date: wireJsonNullableString(),
  startTime: wireJsonNullableString(),
  endTime: wireJsonNullableString(),
  playMode: tournamentPlayModeSchema,
  tournamentMode: tournamentModeSchema,
  entryFee: z.number(),
  minMember: memberCountSchema,
  maxMember: memberCountSchema,
  totalRounds: totalRoundsSchema,
  duration: wireJsonNullableNumber(),
  breakDuration: wireJsonNullableNumber(),
  courts: z.array(tournamentCourtSchema),
  foodInfo: z.string(),
  descriptionInfo: z.string(),
  status: tournamentStatusSchema,
  participants: z.array(tournamentParticipantSchema),
  progress: tournamentProgressSchema,
  permissions: tournamentPermissionsSchema,
  createdAt: wireJsonNullableString(),
  updatedAt: wireJsonNullableString(),
}).transform(normalizeMemberRange);

export const backendTournamentDetailResponseSchema = z.object({
  tournament: backendTournamentDetailSchema,
});

const tournamentInputBaseSchema = z.object({
  sponsor: z.string().nullable(),
  date: z.string().nullable().optional(),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  playMode: tournamentPlayModeSchema,
  tournamentMode: tournamentModeSchema,
  entryFee: z.number(),
  minMember: memberCountSchema,
  maxMember: memberCountSchema,
  totalRounds: totalRoundsSchema,
  duration: z.number().int().min(5).max(240),
  breakDuration: z.number().int().min(0).max(120),
  foodInfo: foodInfoSchema.nullable().optional(),
  descriptionInfo: z.string().nullable().optional(),
});

export const createTournamentInputSchema = tournamentInputBaseSchema
  .extend({
    club: z.string(),
    name: z.string(),
    status: z.enum(["draft", "active"]),
    date: z.string().nullable(),
  })
  .transform(normalizeMemberRange);

export const updateTournamentInputSchema = tournamentInputBaseSchema
  .extend({
    club: z.string(),
    name: z.string(),
    status: tournamentStatusSchema,
  })
  .partial()
  .refine(
    (value) =>
      value.minMember == null ||
      value.maxMember == null ||
      value.minMember <= value.maxMember,
    {
      path: ["minMember"],
      message: "minMember must be less than or equal to maxMember",
    }
  );

export const backendCreateTournamentInputSchema = z.object({
  club: z.string(),
  name: z.string(),
  status: z.enum(["draft", "active"]),
  sponsor: z.string().optional(),
  date: z.string().nullable().optional(),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  playMode: tournamentPlayModeSchema,
  tournamentMode: tournamentModeSchema,
  entryFee: z.number(),
  minMember: memberCountSchema,
  maxMember: memberCountSchema,
  totalRounds: totalRoundsSchema,
  duration: z.number().int().min(5).max(240),
  breakDuration: z.number().int().min(0).max(120),
  foodInfo: foodInfoSchema.nullable().optional(),
  descriptionInfo: z.string().nullable().optional(),
}).transform(normalizeMemberRange);

export const backendUpdateTournamentInputSchema = z
  .object({
    club: z.string(),
    sponsor: z.string().nullable(),
    name: z.string(),
    status: tournamentStatusSchema,
    date: z.string().nullable(),
    startTime: z.string().nullable(),
    endTime: z.string().nullable(),
    playMode: tournamentPlayModeSchema,
    tournamentMode: tournamentModeSchema,
    entryFee: z.number(),
    minMember: memberCountSchema,
    maxMember: memberCountSchema,
    totalRounds: totalRoundsSchema,
    duration: z.number().int().min(5).max(240).nullable(),
    breakDuration: z.number().int().min(0).max(120).nullable(),
    foodInfo: foodInfoSchema.nullable(),
    descriptionInfo: z.string().nullable(),
  })
  .partial()
  .refine(
    (value) =>
      value.minMember == null ||
      value.maxMember == null ||
      value.minMember <= value.maxMember,
    {
      path: ["minMember"],
      message: "minMember must be less than or equal to maxMember",
    }
  );

const createTournamentSummarySchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  club: z.string(),
  status: z.string(),
  date: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional(),
});

const updateTournamentSummarySchema = z
  .object({
    id: z.string(),
    name: z.string().optional(),
    club: z.string().optional(),
    status: z.string().optional(),
    date: z.string().nullable().optional(),
    updatedAt: z.string().nullable().optional(),
  })
  .passthrough();

const tournamentParticipationSummarySchema = z.object({
  id: z.string(),
  spotsFilled: z.number(),
  spotsTotal: z.number(),
  isParticipant: z.boolean(),
  participants: z.array(tournamentParticipantSchema).optional(),
  permissions: tournamentPermissionsSchema.partial().optional(),
});

export const createTournamentResponseSchema = z.object({
  message: z.string(),
  tournament: createTournamentSummarySchema,
});

export const updateTournamentResponseSchema = z.object({
  message: z.string(),
  tournament: updateTournamentSummarySchema,
});

export const joinTournamentResponseSchema = z.object({
  message: z.string(),
  tournament: tournamentParticipationSummarySchema,
});

export const leaveTournamentResponseSchema = z.object({
  message: z.string(),
  tournament: tournamentParticipationSummarySchema,
});

export const tournamentDetailResponseSchema = z.object({
  tournament: backendTournamentDetailSchema,
});

export type TournamentClub = z.infer<typeof tournamentClubSchema>;
export type TournamentSponsor = z.infer<typeof tournamentSponsorSchema>;
export type ClubSponsorSummary = z.infer<typeof tournamentSponsorSchema>;
export type TournamentCourt = z.infer<typeof tournamentCourtSchema>;
export type TournamentParticipant = z.infer<typeof tournamentParticipantSchema>;
export type TournamentListItem = z.infer<typeof tournamentListItemSchema>;
export type TournamentListFilters = z.infer<typeof tournamentListFiltersSchema>;
export type TournamentPagination = z.infer<typeof tournamentPaginationSchema>;
export type TournamentsResponse = z.infer<typeof tournamentsResponseSchema>;
export type TournamentDetail = z.infer<typeof backendTournamentDetailSchema>;
export type TournamentDetailResponse = z.infer<typeof tournamentDetailResponseSchema>;
export type TournamentMatchStatus = z.infer<typeof tournamentMatchStatusSchema>;
export type TournamentScheduleMode = z.infer<typeof tournamentScheduleModeSchema>;
export type TournamentMatchPlayer = z.infer<typeof tournamentMatchPlayerSchema>;
export type TournamentMatchCourt = z.infer<typeof tournamentMatchCourtSchema>;
export type TournamentScheduleMatch = z.infer<typeof tournamentScheduleMatchSchema>;
export type TournamentScheduleInfo = z.infer<typeof tournamentScheduleInfoSchema>;
export type TournamentMatchesResponse = z.infer<typeof tournamentMatchesResponseSchema>;
export type TournamentLiveMatchItem = z.infer<typeof tournamentLiveMatchItemSchema>;
export type TournamentLiveMatchResponse = z.infer<typeof tournamentLiveMatchResponseSchema>;
export type RecordTournamentMatchScoreInput = z.infer<typeof recordTournamentMatchScoreInputSchema>;
export type RecordTournamentMatchScoreResponse = z.infer<typeof recordTournamentMatchScoreResponseSchema>;
export type TournamentScheduleInput = z.infer<typeof tournamentScheduleInputSchema>;
export type TournamentScheduleParticipant = z.infer<typeof tournamentScheduleParticipantSchema>;
export type TournamentScheduleResponse = z.infer<typeof tournamentScheduleResponseSchema>;
export type GenerateTournamentScheduleInput = z.infer<typeof generateTournamentScheduleInputSchema>;
export type GenerateTournamentScheduleResponse = z.infer<typeof generateTournamentScheduleResponseSchema>;
export type GenerateTournamentDoublesPairsInput = z.infer<typeof generateTournamentDoublesPairsInputSchema>;
export type TournamentSchedulePairPlayer = z.infer<typeof tournamentSchedulePairPlayerSchema>;
export type GenerateTournamentDoublesPairsResponse = z.infer<typeof generateTournamentDoublesPairsResponseSchema>;
export type BackendTournamentDetail = z.infer<typeof backendTournamentDetailSchema>;
export type BackendTournamentDetailResponse = z.infer<typeof backendTournamentDetailResponseSchema>;
export type CreateTournamentInput = z.infer<typeof createTournamentInputSchema>;
export type UpdateTournamentInput = z.infer<typeof updateTournamentInputSchema>;
export type BackendCreateTournamentInput = z.infer<typeof backendCreateTournamentInputSchema>;
export type BackendUpdateTournamentInput = z.infer<typeof backendUpdateTournamentInputSchema>;
export type CreateTournamentResponse = z.infer<typeof createTournamentResponseSchema>;
export type UpdateTournamentResponse = z.infer<typeof updateTournamentResponseSchema>;
export type JoinTournamentResponse = z.infer<typeof joinTournamentResponseSchema>;
export type LeaveTournamentResponse = z.infer<typeof leaveTournamentResponseSchema>;

export function isTournamentWhenFilter(value: string): value is TournamentWhenFilter {
  return value === "future" || value === "past";
}

export function isTournamentDistanceFilter(value: string): value is TournamentDistanceFilter {
  return value === "under50" || value === "between50And80" || value === "over80";
}
