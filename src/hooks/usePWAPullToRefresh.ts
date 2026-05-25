import { useEffect } from "react";
import PullToRefresh from "pulltorefreshjs";

function isPWAStandalone(): boolean {
  if (
    "standalone" in window.navigator &&
    (window.navigator as { standalone?: boolean }).standalone === true
  ) {
    return true;
  }
  return window.matchMedia("(display-mode: standalone)").matches;
}

/**
 * usePWAPullToRefresh
 *
 * Initialises `pulltorefreshjs` when running as an installed iOS PWA.
 * The library is a no-op in regular Safari browser tabs (the browser's
 * native PTR already handles it there).
 *
 * pulltorefreshjs handles:
 *  - Touch detection and threshold tracking
 *  - Animated pull indicator
 *  - Calling onRefresh (we use window.location.reload())
 *
 * It is destroyed on unmount so there are no duplicate listeners if the
 * component re-mounts (e.g. React strict mode double-invoke in dev).
 */
export function usePWAPullToRefresh(): void {
  useEffect(() => {
    if (!isPWAStandalone()) return;

    PullToRefresh.init({
      mainElement: "body",
      onRefresh() {
        window.location.reload();
      },
      // Only trigger when the page is truly at the top
      shouldPullToRefresh() {
        return window.scrollY < 1;
      },
      // Branded colours matching the app
      iconArrow: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
        viewBox="0 0 24 24" fill="none" stroke="#067429" stroke-width="2.5"
        stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12a9 9 0 1 1-6.22-8.56"/>
        <polyline points="21 3 21 9 15 9"/>
      </svg>`,
      iconRefreshing: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
        viewBox="0 0 24 24" fill="none" stroke="#067429" stroke-width="2.5"
        stroke-linecap="round" stroke-linejoin="round"
        style="animation: pwa-ptr-spin 0.7s linear infinite; display: block;">
        <path d="M21 12a9 9 0 1 1-6.22-8.56"/>
        <polyline points="21 3 21 9 15 9"/>
      </svg>`,
    });

    return () => {
      PullToRefresh.destroyAll();
    };
  }, []);
}
