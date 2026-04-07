/**
 * Centralized query keys for TanStack Query.
 * Use these for consistency and easy invalidation.
 */
export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    me: () => [...queryKeys.auth.all, "me"] as const,
  },
  user: {
    all: ["user"] as const,
    profile: (id?: string) =>
      id != null
        ? ([...queryKeys.user.all, "profile", id] as const)
        : ([...queryKeys.user.all, "profile"] as const),
    favoriteClubs: () => [...queryKeys.user.all, "favorite-clubs"] as const,
    adminClubs: () => [...queryKeys.user.all, "admin-clubs"] as const,
    search: (query: string) =>
      [...queryKeys.user.all, "search", query] as const,
  },
  club: {
    all: ["club"] as const,
    listRoot: () => [...queryKeys.club.all, "list"] as const,
    list: (filters?: { page?: number; limit?: number; q?: string }) => {
      const f = filters ?? {};
      const normalizedFilters: Record<string, string | number> = {};
      if (f.page != null) normalizedFilters.page = f.page;
      if (f.limit != null) normalizedFilters.limit = f.limit;
      if (f.q?.trim()) normalizedFilters.q = f.q.trim();
      return [...queryKeys.club.listRoot(), normalizedFilters] as const;
    },
    detail: (id: string) => [...queryKeys.club.all, "detail", id] as const,
    staff: (id: string) => [...queryKeys.club.all, "staff", id] as const,
    sponsors: (id: string) => [...queryKeys.club.all, "sponsors", id] as const,
  },
  admin: {
    all: ["admin"] as const,
    clubSubscriptions: () => [...queryKeys.admin.all, "club-subscriptions"] as const,
    platformSponsors: () => [...queryKeys.admin.all, "platform-sponsors"] as const,
  },
  sponsors: {
    all: ["sponsors", "all"] as const,
  },
  tournament: {
    all: ["tournament"] as const,
    list: (filters?: {
      page?: number;
      limit?: number;
      q?: string;
      view?: "published" | "drafts";
      when?: "future" | "past";
      distance?: "under50" | "between50And80" | "over80";
      clubId?: string;
    }) => {
      const f = filters ?? {};
      const normalizedFilters: Record<string, string | number> = {};
      if (f.view) normalizedFilters.view = f.view;
      if (f.when) normalizedFilters.when = f.when;
      if (f.distance) normalizedFilters.distance = f.distance;
      if (f.clubId) normalizedFilters.clubId = f.clubId;
      if (f.page != null) normalizedFilters.page = f.page;
      if (f.limit != null) normalizedFilters.limit = f.limit;
      if (f.q) normalizedFilters.q = f.q;
      return [...queryKeys.tournament.all, "list", normalizedFilters] as const;
    },
    detail: (id: string | null) => [...queryKeys.tournament.all, "detail", id] as const,
  },
} as const;
