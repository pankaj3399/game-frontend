import { QueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";

/** Do not retry client errors (4xx); retry transient failures up to twice. */
function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    if (status != null && status >= 400 && status < 500) {
      return false;
    }
  }
  return failureCount < 2;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Reuse fresh data across route transitions; avoid refetch-on-every-mount.
      staleTime: 30_000,
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: shouldRetryQuery,
      refetchOnMount: true,
      // Tab focus refetches feel like “the app is slow”; rely on staleTime + explicit invalidation.
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
