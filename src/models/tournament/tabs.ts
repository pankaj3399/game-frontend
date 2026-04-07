export const TournamentTab = {
  Drafts: "drafts",
  Published: "published",
} as const;

export type TournamentTabValue = (typeof TournamentTab)[keyof typeof TournamentTab];
