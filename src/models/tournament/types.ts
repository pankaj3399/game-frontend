import { z } from "zod";

export const tournamentStatusSchema = z.enum(["active", "draft", "inactive"]);
export const tournamentModeSchema = z.enum(["singleDay", "period"]);
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
  address: z.string().nullable().optional(),
});

export const tournamentSponsorSchema = z.object({
  id: z.string(),
  name: z.string(),
  logoUrl: z.string().nullable(),
  link: z.string().nullable(),
});

export const tournamentCourtSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string().nullable(),
  placement: z.string().nullable(),
});

export const tournamentParticipantSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  alias: z.string().nullable(),
});

export const tournamentProgressSchema = z.object({
  spotsFilled: z.number(),
  spotsTotal: z.number(),
  percentage: z.number(),
});

export const tournamentPermissionsSchema = z.object({
  canEdit: z.boolean(),
  canJoin: z.boolean(),
  isParticipant: z.boolean(),
});

export const tournamentListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  club: tournamentClubSchema.nullable(),
  date: z.string().nullable(),
  status: tournamentStatusSchema,
  sponsor: tournamentSponsorSchema.nullable(),
});

export const tournamentListFiltersSchema = z.object({
  status: tournamentStatusSchema.optional(),
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
  logo: z.string().nullable(),
  club: tournamentClubSchema.nullable(),
  sponsor: tournamentSponsorSchema.nullable(),
  clubSponsors: z.array(tournamentSponsorSchema),
  date: z.string().nullable(),
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
  playMode: tournamentPlayModeSchema,
  tournamentMode: tournamentModeSchema,
  entryFee: z.number(),
  minMember: z.number(),
  maxMember: z.number(),
  duration: z.string(),
  breakDuration: z.string(),
  courts: z.array(tournamentCourtSchema),
  foodInfo: z.string(),
  descriptionInfo: z.string(),
  status: tournamentStatusSchema,
  participants: z.array(tournamentParticipantSchema),
  progress: tournamentProgressSchema,
  permissions: tournamentPermissionsSchema,
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
});

export const backendTournamentDetailResponseSchema = z.object({
  tournament: backendTournamentDetailSchema,
});

const tournamentInputBaseSchema = z.object({
  sponsor: z.string().nullable(),
  logo: z.string().nullable().optional(),
  date: z.string().nullable().optional(),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  playMode: tournamentPlayModeSchema,
  tournamentMode: tournamentModeSchema,
  entryFee: z.number(),
  minMember: z.number(),
  maxMember: z.number(),
  duration: z.string(),
  breakDuration: z.string(),
  courts: z.array(z.string()).optional(),
  foodInfo: z.string().nullable().optional(),
  descriptionInfo: z.string().nullable().optional(),
});

export const createTournamentInputSchema = tournamentInputBaseSchema.extend({
  club: z.string(),
  name: z.string(),
  status: z.enum(["draft", "active"]),
  date: z.string().nullable(),
});

export const updateTournamentInputSchema = tournamentInputBaseSchema
  .extend({
    club: z.string(),
    name: z.string(),
  })
  .partial();

export const backendCreateTournamentInputSchema = z.object({
  club: z.string(),
  name: z.string(),
  status: z.enum(["draft", "active"]),
  sponsor: z.string().optional(),
  logo: z.string().nullable().optional(),
  date: z.string().nullable().optional(),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  playMode: tournamentPlayModeSchema,
  tournamentMode: tournamentModeSchema,
  entryFee: z.number(),
  minMember: z.number(),
  maxMember: z.number(),
  duration: z.string(),
  breakDuration: z.string(),
  courts: z.array(z.string()).optional(),
  foodInfo: z.string().nullable().optional(),
  descriptionInfo: z.string().nullable().optional(),
});

export const backendUpdateTournamentInputSchema = z
  .object({
    club: z.string(),
    sponsor: z.string().nullable(),
    name: z.string(),
    logo: z.string().nullable(),
    date: z.string().nullable(),
    startTime: z.string().nullable(),
    endTime: z.string().nullable(),
    playMode: tournamentPlayModeSchema,
    tournamentMode: tournamentModeSchema,
    entryFee: z.number(),
    minMember: z.number(),
    maxMember: z.number(),
    duration: z.string().nullable(),
    breakDuration: z.string().nullable(),
    courts: z.array(z.string()),
    foodInfo: z.string().nullable(),
    descriptionInfo: z.string().nullable(),
  })
  .partial();

const createTournamentSummarySchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  club: z.string(),
  status: z.string(),
  date: z.string().optional(),
  createdAt: z.string().optional(),
});

const updateTournamentSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  club: z.string(),
  status: z.string(),
  date: z.string().optional(),
  updatedAt: z.string().optional(),
});

const publishTournamentSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  club: z.string(),
  status: z.string(),
});

const joinTournamentSummarySchema = z.object({
  id: z.string(),
  spotsFilled: z.number(),
  spotsTotal: z.number(),
  isParticipant: z.boolean(),
});

export const publishTournamentPayloadSchema = z.object({}).strict();

export const createTournamentResponseSchema = z.object({
  message: z.string(),
  tournament: createTournamentSummarySchema,
});

export const updateTournamentResponseSchema = z.object({
  message: z.string(),
  tournament: updateTournamentSummarySchema,
});

export const publishTournamentResponseSchema = z.object({
  message: z.string(),
  tournament: publishTournamentSummarySchema,
});

export const joinTournamentResponseSchema = z.object({
  message: z.string(),
  tournament: joinTournamentSummarySchema,
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
export type BackendTournamentDetail = z.infer<typeof backendTournamentDetailSchema>;
export type BackendTournamentDetailResponse = z.infer<typeof backendTournamentDetailResponseSchema>;
export type CreateTournamentInput = z.infer<typeof createTournamentInputSchema>;
export type UpdateTournamentInput = z.infer<typeof updateTournamentInputSchema>;
export type BackendCreateTournamentInput = z.infer<typeof backendCreateTournamentInputSchema>;
export type BackendUpdateTournamentInput = z.infer<typeof backendUpdateTournamentInputSchema>;
export type PublishTournamentPayload = z.infer<typeof publishTournamentPayloadSchema>;
export type CreateTournamentResponse = z.infer<typeof createTournamentResponseSchema>;
export type UpdateTournamentResponse = z.infer<typeof updateTournamentResponseSchema>;
export type PublishTournamentResponse = z.infer<typeof publishTournamentResponseSchema>;
export type JoinTournamentResponse = z.infer<typeof joinTournamentResponseSchema>;

export function isTournamentWhenFilter(value: string): value is TournamentWhenFilter {
  return value === "future" || value === "past";
}

export function isTournamentDistanceFilter(value: string): value is TournamentDistanceFilter {
  return value === "under50" || value === "between50And80" || value === "over80";
}
