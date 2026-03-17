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
    detail: (id: string) => [...queryKeys.club.all, "detail", id] as const,
    staff: (id: string) => [...queryKeys.club.all, "staff", id] as const,
    sponsors: (id: string) => [...queryKeys.club.all, "sponsors", id] as const,
  },
  sponsors: {
    all: ["sponsors", "all"] as const,
  },
  tournament: {
    all: ["tournament"] as const,
    list: (filters?: {
      status?: string;
      page?: number;
      limit?: number;
      q?: string;
      view?: "published" | "drafts";
    }) => {
      const f = filters ?? {};
      const normalizedFilters: Record<string, string | number> = {};
      if (f.status) normalizedFilters.status = f.status;
      if (f.view) normalizedFilters.view = f.view;
      if (f.page != null) normalizedFilters.page = f.page;
      if (f.limit != null) normalizedFilters.limit = f.limit;
      if (f.q) normalizedFilters.q = f.q;
      return [...queryKeys.tournament.all, "list", normalizedFilters] as const;
    },
    detail: (id: string | null) => [...queryKeys.tournament.all, "detail", id] as const,
  },
} as const;
