import { useEffect } from "react";

/**
 * Detects whether the app is running as an installed PWA in standalone mode.
 * - `navigator.standalone` is an iOS-only boolean set by WebKit when launched
 *   from the Home Screen (not available in normal Safari browser tabs).
 * - The `display-mode: standalone` media query is the W3C-standard equivalent
 *   and works on Android PWAs too.
 */
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
 * Implements a native-feeling pull-to-refresh gesture exclusively for iOS
 * PWA standalone mode. In normal Safari browser tabs, iOS provides this at
 * the browser-chrome level, so we must NOT override it there.
 *
 * Behaviour:
 *  - Only active when `isPWAStandalone()` returns true.
 *  - Listens for a downward touch drag starting when the page is scrolled
 *    to the very top (scrollY === 0).
 *  - Renders a branded circular indicator that follows the pull distance
 *    with a resistance curve (pull × 0.45) so it feels physically natural.
 *  - Releases a spinning loader and reloads after 300ms when the pull
 *    distance exceeds the THRESHOLD (80px of actual drag, ~36px on screen).
 *  - All event listeners are { passive: true } to avoid janking the scroll.
 *  - Cleans up fully on unmount (removes listeners and the DOM node).
 */
export function usePWAPullToRefresh(): void {
  useEffect(() => {
    if (!isPWAStandalone()) return;

    const THRESHOLD = 80; // px of raw touch delta before triggering reload
    const RESISTANCE = 0.45; // dampening factor for rubber-band feel

    let startY = 0;
    let isDragging = false;
    let reloading = false;

    /* ── Indicator element ─────────────────────────────────────────────── */
    const indicator = document.createElement("div");
    indicator.id = "pwa-ptr";
    indicator.setAttribute("aria-hidden", "true");
    indicator.style.cssText = `
      position: fixed;
      top: env(safe-area-inset-top, 0px);
      left: 50%;
      z-index: 99999;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #067429;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 3px 12px rgba(0,0,0,0.25);
      pointer-events: none;
      will-change: transform, opacity;
      transform: translateX(-50%) translateY(-56px);
      opacity: 0;
      transition: none;
    `;

    const REFRESH_SVG = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
           viewBox="0 0 24 24" fill="none" stroke="white"
           stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12a9 9 0 1 1-6.22-8.56"/>
        <polyline points="21 3 21 9 15 9"/>
      </svg>`;
    indicator.innerHTML = REFRESH_SVG;
    document.body.appendChild(indicator);

    function setIndicatorStyle(pullPx: number, spinning: boolean): void {
      // pullPx is the dampened on-screen travel distance (0 → THRESHOLD)
      const progress = Math.min(pullPx / (THRESHOLD * RESISTANCE), 1);
      const translateY = pullPx - 56; // -56 = hidden above viewport
      indicator.style.transform = `translateX(-50%) translateY(${translateY}px)`;
      indicator.style.opacity = String(Math.min(progress * 1.5, 1));

      const svg = indicator.querySelector("svg");
      if (svg) {
        if (spinning) {
          svg.style.animation = "pwa-ptr-spin 0.7s linear infinite";
        } else {
          // Rotate the icon to show pull progress (0° → 360°)
          svg.style.animation = "none";
          svg.style.transform = `rotate(${progress * 300}deg)`;
        }
      }
    }

    function hide(smooth = false): void {
      if (smooth) {
        indicator.style.transition =
          "transform 0.3s ease, opacity 0.3s ease";
      }
      indicator.style.transform = "translateX(-50%) translateY(-56px)";
      indicator.style.opacity = "0";
    }

    /* ── Touch handlers ────────────────────────────────────────────────── */
    function onTouchStart(e: TouchEvent): void {
      if (reloading) return;
      // Only start tracking if the page is scrolled to the absolute top
      if (window.scrollY > 1) return;
      startY = e.touches[0].clientY;
      isDragging = true;
      indicator.style.transition = "none";
    }

    function onTouchMove(e: TouchEvent): void {
      if (!isDragging || reloading) return;
      const delta = e.touches[0].clientY - startY;
      if (delta <= 0) {
        // Swiping up — cancel
        isDragging = false;
        hide();
        return;
      }
      const dampened = delta * RESISTANCE;
      setIndicatorStyle(dampened, false);
    }

    function onTouchEnd(e: TouchEvent): void {
      if (!isDragging || reloading) return;
      isDragging = false;

      const delta = e.changedTouches[0].clientY - startY;
      const dampened = delta * RESISTANCE;

      if (dampened >= THRESHOLD * RESISTANCE) {
        // Threshold met — show spinning state, then reload
        reloading = true;
        setIndicatorStyle(dampened, true);
        indicator.style.transition =
          "transform 0.2s ease, opacity 0.2s ease";
        indicator.style.transform = `translateX(-50%) translateY(14px)`;
        indicator.style.opacity = "1";
        setTimeout(() => {
          window.location.reload();
        }, 400);
      } else {
        // Not far enough — snap back
        hide(true);
      }
    }

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      indicator.remove();
    };
  }, []);
}
