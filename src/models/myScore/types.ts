import { z } from "zod";
import { PAGE_SIZE } from "@/pages/my-score/constants";

export const myScoreFilterModeSchema = z.enum(["all", "singles", "doubles"]);
export const myScoreDateRangeSchema = z.enum(["last30Days", "allTime"]);
export const myScoreMatchModeSchema = z.enum(["singles", "doubles"]);
export const myScoreDefaultPagination = {
  page: 1,
  limit: PAGE_SIZE,
  total: 0,
  totalPages: 0,
} as const;

export type MyScoreFilterMode = z.infer<typeof myScoreFilterModeSchema>;
export type MyScoreDateRange = z.infer<typeof myScoreDateRangeSchema>;

export const myScorePaginationSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
});

export const myScoreEntrySchema = z.object({
  id: z.string(),
  playedAt: z.string(),
  tournament: z.object({
    id: z.string().nullable(),
    name: z.string(),
  }),
  opponent: z.object({
    id: z.string(),
    name: z.string(),
  }),
  mode: myScoreMatchModeSchema,
  myScore: z.number().nullable(),
  opponentScore: z.number().nullable(),
  didWin: z.boolean().nullable(),
  /** 'pendingScore' = awaiting opponent confirmation; 'finished' = confirmed. Defaults to 'finished' for older entries. */
  status: z.enum(["pendingScore", "finished"]).optional().default("finished"),
});

export const myScoreResponseSchema = z.object({
  player: z
    .object({
      id: z.string(),
      displayName: z.string(),
    })
    .optional(),
  summary: z.object({
    totalMatches: z.number().int().min(0),
    totalWins: z.number().int().min(0),
    glicko2: z.object({
      rating: z.number(),
      rd: z.number(),
    }),
  }),
  filters: z.object({
    mode: myScoreFilterModeSchema,
    range: myScoreDateRangeSchema,
    limit: z.number().int().min(1).optional(),
  }),
  pagination: myScorePaginationSchema.optional().default(myScoreDefaultPagination),
  entries: z.array(myScoreEntrySchema),
});

export type MyScoreEntry = z.infer<typeof myScoreEntrySchema>;
export type MyScoreResponse = z.infer<typeof myScoreResponseSchema>;
