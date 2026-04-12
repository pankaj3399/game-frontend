import { z } from "zod";

export const myScoreFilterModeSchema = z.enum(["all", "singles", "doubles"]);
export const myScoreDateRangeSchema = z.enum(["last30Days", "allTime"]);
export const myScoreMatchModeSchema = z.enum(["singles", "doubles"]);

export type MyScoreFilterMode = z.infer<typeof myScoreFilterModeSchema>;
export type MyScoreDateRange = z.infer<typeof myScoreDateRangeSchema>;

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
});

export const myScoreResponseSchema = z.object({
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
  }),
  entries: z.array(myScoreEntrySchema),
});

export type MyScoreEntry = z.infer<typeof myScoreEntrySchema>;
export type MyScoreResponse = z.infer<typeof myScoreResponseSchema>;
