import { useEffect } from "react";

function isIOS(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isStandalone(): boolean {
  return (
    ("standalone" in navigator &&
      (navigator as { standalone?: boolean }).standalone === true) ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

const CARD_STYLE =
  "width:44px;height:44px;border-radius:50%;" +
  "background:rgba(255,255,255,0.96);" +
  "backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);" +
  "box-shadow:0 6px 24px rgba(0,0,0,0.13),0 0 0 1px rgba(0,0,0,0.05);" +
  "display:flex;align-items:center;justify-content:center;";

const SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"' +
  ' viewBox="0 0 24 24" fill="none" stroke="#067429" stroke-width="2.5"' +
  ' stroke-linecap="round" stroke-linejoin="round" style="display:block">' +
  '<path d="M21 12a9 9 0 1 1-6.22-8.56"/><polyline points="21 3 21 9 15 9"/>' +
  "</svg>";

const ICON_PULL = `<div style="${CARD_STYLE}">${SVG}</div>`;

const ICON_SPIN =
  `<div style="${CARD_STYLE}">` +
  '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"' +
  ' viewBox="0 0 24 24" fill="none" stroke="#067429" stroke-width="2.5"' +
  ' stroke-linecap="round" stroke-linejoin="round"' +
  ' style="display:block;animation:pwa-ptr-spin 0.7s linear infinite">' +
  '<path d="M21 12a9 9 0 1 1-6.22-8.56"/><polyline points="21 3 21 9 15 9"/>' +
  "</svg></div>";

const PWA_PTR_IGNORE_SELECTOR = '[data-pwa-ptr-ignore="true"]';
const SCROLLABLE_OVERFLOW_VALUES = new Set(["auto", "scroll", "overlay"]);

/**
 * How long (ms) to suppress PTR after a finger release.
 *
 * pulltorefreshjs keeps its internal state in a "release phase" for ~400–500 ms
 * while it animates back to rest. During that window, window.scrollY is still 0,
 * so any new touchstart would re-enter PTR tracking and block normal scrolling.
 * A 600 ms cooldown comfortably covers the animation without feeling sluggish.
 */
const RELEASE_COOLDOWN_MS = 600;

function isScrollableElement(element: Element): boolean {
  const { overflowY } = window.getComputedStyle(element);

  return (
    SCROLLABLE_OVERFLOW_VALUES.has(overflowY) &&
    element.scrollHeight > element.clientHeight
  );
}

function isIgnoredPullTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  if (target.closest(PWA_PTR_IGNORE_SELECTOR)) return true;

  let current: Element | null = target;
  while (current && current !== document.body) {
    if (isScrollableElement(current)) return true;
    current = current.parentElement;
  }

  return false;
}

export function usePWAPullToRefresh(): void {
  useEffect(() => {
    // Keep this check sync and before any dynamic import so non-iOS / browser-tab
    // sessions never download pulltorefreshjs.
    if (!isIOS() || !isStandalone()) return;

    let cancelled = false;
    let destroyPtr: (() => void) | undefined;
    let removeListeners: (() => void) | undefined;

    const state = {
      isPullTargetIgnored: false,
      suppressUntil: 0,
    };

    const handleTouchStart = (event: TouchEvent | PointerEvent) => {
      state.isPullTargetIgnored = isIgnoredPullTarget(event.target);
    };

    const handleTouchEnd = () => {
      state.isPullTargetIgnored = false;
      state.suppressUntil = Date.now() + RELEASE_COOLDOWN_MS;
    };

    void import("pulltorefreshjs").then((mod) => {
      if (cancelled) return;

      const PullToRefresh = mod.default;

      window.addEventListener("touchstart", handleTouchStart, {
        passive: true,
        capture: true,
      });
      window.addEventListener("touchend", handleTouchEnd, { passive: true });
      window.addEventListener("touchcancel", handleTouchEnd, { passive: true });
      window.addEventListener("pointerdown", handleTouchStart, {
        passive: true,
        capture: true,
      });
      window.addEventListener("pointerup", handleTouchEnd, { passive: true });
      window.addEventListener("pointercancel", handleTouchEnd, { passive: true });

      removeListeners = () => {
        window.removeEventListener("touchstart", handleTouchStart, true);
        window.removeEventListener("touchend", handleTouchEnd);
        window.removeEventListener("touchcancel", handleTouchEnd);
        window.removeEventListener("pointerdown", handleTouchStart, true);
        window.removeEventListener("pointerup", handleTouchEnd);
        window.removeEventListener("pointercancel", handleTouchEnd);
      };

      PullToRefresh.init({
        mainElement: "body",
        // distMax controls total travel; the library initialises `top` at
        // -(element offsetHeight). With padding-top:72px in .ptr--box the
        // element is ~120px tall, so the circle is fully hidden until the
        // user has pulled ~72px — naturally preventing taps from showing it.
        distMax: 120,
        distReload: 90,

        onRefresh() {
          window.location.reload();
        },

        shouldPullToRefresh() {
          if (state.isPullTargetIgnored) return false;

          // Suppress PTR during the release cooldown window so the library's own
          // animation settle does not re-engage PTR on the user's next swipe.
          if (Date.now() < state.suppressUntil) return false;

          return (
            Math.max(
              document.documentElement.scrollTop,
              document.body.scrollTop,
              window.scrollY,
            ) <= 0
          );
        },

        instructionsPullToRefresh: "",
        instructionsReleaseToRefresh: "",
        instructionsRefreshing: "",

        iconArrow: ICON_PULL,
        iconRefreshing: ICON_SPIN,
      });

      destroyPtr = () => {
        PullToRefresh.destroyAll();
      };
    });

    return () => {
      cancelled = true;
      removeListeners?.();
      destroyPtr?.();
    };
  }, []);
}
