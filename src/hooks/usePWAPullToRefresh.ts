import { useEffect } from "react";
import PullToRefresh from "pulltorefreshjs";

/**
 * usePWAPullToRefresh
 *
 * Provides pull-to-refresh for iOS PWA standalone mode via pulltorefreshjs.
 *
 * Key decisions:
 *
 * 1. NO standalone guard on init — the previous implementations never fired
 *    because `navigator.standalone` / matchMedia can fail to match on iOS 26
 *    (timing issues, EU DMA mode, or WebKit quirks). We always initialise the
 *    library and use `shouldPullToRefresh` to gate it at gesture-time instead.
 *
 * 2. `shouldPullToRefresh` runs at the moment of each pull attempt, giving it
 *    the best chance of reading the correct runtime state.
 *
 * 3. overscroll-behavior fix — see globals.css: body must NOT have
 *    overscroll-behavior-y: none/contain, which would block the touch gesture
 *    the library relies on.
 */
export function usePWAPullToRefresh(): void {
  useEffect(() => {
    PullToRefresh.init({
      mainElement: "body",

      onRefresh() {
        window.location.reload();
      },

      /**
       * Evaluated on every pull attempt — runs in the browser at gesture time,
       * so it reads the actual runtime display-mode reliably.
       *
       * We still prefer PTR to be PWA-only to avoid duplicating Safari's
       * native behaviour, but we accept any standalone/fullscreen mode and
       * fall back to always-true when neither API is available (belt-and-
       * suspenders for iOS 26 edge cases).
       */
      shouldPullToRefresh() {
        if (window.scrollY > 2) return false;

        // iOS-specific legacy property
        const legacyStandalone =
          "standalone" in navigator &&
          (navigator as { standalone?: boolean }).standalone === true;

        // W3C standard — evaluated at gesture time, not startup
        const mediaStandalone =
          window.matchMedia("(display-mode: standalone)").matches ||
          window.matchMedia("(display-mode: fullscreen)").matches;

        // If neither API reports standalone, still allow it — the guard
        // above (scrollY > 2) is enough to prevent conflict with Safari's
        // native PTR in most cases, and it ensures PWA users always get it.
        return legacyStandalone || mediaStandalone || true;
      },

      // Branded refresh icon
      iconArrow: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22"
        viewBox="0 0 24 24" fill="none" stroke="#067429" stroke-width="2.5"
        stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12a9 9 0 1 1-6.22-8.56"/>
        <polyline points="21 3 21 9 15 9"/>
      </svg>`,
      iconRefreshing: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22"
        viewBox="0 0 24 24" fill="none" stroke="#067429" stroke-width="2.5"
        stroke-linecap="round" stroke-linejoin="round"
        style="animation:pwa-ptr-spin 0.7s linear infinite;display:block">
        <path d="M21 12a9 9 0 1 1-6.22-8.56"/>
        <polyline points="21 3 21 9 15 9"/>
      </svg>`,
    });

    return () => {
      PullToRefresh.destroyAll();
    };
  }, []);
}
