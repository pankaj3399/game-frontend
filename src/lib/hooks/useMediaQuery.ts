import { useCallback, useMemo, useSyncExternalStore } from "react";

/** Default Tailwind `lg` breakpoint (px); keep in sync with `tailwind.config` if customized. */
export const TW_BREAKPOINT_LG_PX = 1024;

export type UseMediaQueryOptions = {
  /**
   * Value during SSR and the first client pass before `matchMedia` runs.
   * Prefer `false` when “mobile-first” layout is the safe default.
   */
  defaultValue?: boolean;
};

/**
 * Subscribes to `window.matchMedia(query)` with `useSyncExternalStore` so:
 * - updates batch with React rendering (no `setState` + extra paint),
 * - SSR/hydration use a deterministic `defaultValue`,
 * - the listener is removed on unmount.
 *
 * Pass a **stable** `query` (string literal, constant, or `useMemo`) so the subscription is not torn down every render.
 */
export function useMediaQuery(query: string, options?: UseMediaQueryOptions): boolean {
  const defaultValue = options?.defaultValue ?? false;

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
        return () => {};
      }
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onStoreChange);
      return () => mql.removeEventListener("change", onStoreChange);
    },
    [query]
  );

  const getSnapshot = useCallback((): boolean => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return defaultValue;
    }
    return window.matchMedia(query).matches;
  }, [defaultValue, query]);

  const getServerSnapshot = useCallback(() => defaultValue, [defaultValue]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * `useMediaQuery(\`(min-width: ${minWidthPx}px)\`)` with a memoized query string.
 */
export function useMinWidth(minWidthPx: number, options?: UseMediaQueryOptions): boolean {
  const normalizedMinWidth = useMemo(() => {
    if (!Number.isFinite(minWidthPx)) {
      if (import.meta.env.DEV) {
        console.warn("[useMinWidth] Expected a finite minWidthPx value.", { minWidthPx });
      }
      return null;
    }
    if (minWidthPx < 0) {
      if (import.meta.env.DEV) {
        console.warn("[useMinWidth] Negative minWidthPx clamped to 0.", { minWidthPx });
      }
      return 0;
    }
    return minWidthPx;
  }, [minWidthPx]);

  const query = useMemo(() => {
    if (normalizedMinWidth === null) {
      return null;
    }
    return `(min-width: ${normalizedMinWidth}px)`;
  }, [normalizedMinWidth]);

  const matches = useMediaQuery(query ?? "(min-width: 0px)", options);
  if (query === null) {
    return false;
  }
  return matches;
}
