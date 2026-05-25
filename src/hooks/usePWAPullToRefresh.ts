import { useEffect } from "react";

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
 * iOS PWA standalone mode has no browser pull-to-refresh. This hook provides
 * a visible, native-feeling replacement.
 *
 * Why not pulltorefreshjs: that library is built for Android Chrome — it detects
 * overscroll via scrollTop going negative, which never happens on iOS Safari.
 *
 * This implementation:
 * - Attaches passive touch listeners to `window`
 * - Only activates when the page is scrolled to the very top (scrollY < 2)
 * - Shows a branded pill indicator immediately below the navbar that fades +
 *   slides in starting from the FIRST pixel of pull (not from off-screen)
 * - 60px raw drag threshold before "Release to refresh" state
 * - Calls window.location.reload() on release past threshold
 */
export function usePWAPullToRefresh(): void {
  useEffect(() => {
    if (!isPWAStandalone()) return;

    const THRESHOLD = 60;      // raw px drag before triggering reload
    const NAVBAR_H  = 56;      // keep in sync with AppNavbar h-[56px]

    let startY      = 0;
    let lastDelta   = 0;
    let isDragging  = false;
    let reloading   = false;

    /* ── Indicator ──────────────────────────────────────────────────────
     * Positioned at top: NAVBAR_H so it lives INSIDE the visible content
     * area. It starts invisible (opacity 0, shifted up 20px) and slides
     * into full view as the user pulls. The user sees it from the very
     * first pixel of pull — no hidden-above-the-viewport problem.
     * ──────────────────────────────────────────────────────────────────*/
    const el = document.createElement("div");
    el.id = "pwa-ptr";
    el.setAttribute("aria-hidden", "true");
    el.style.cssText = `
      position: fixed;
      top: ${NAVBAR_H}px;
      left: 50%;
      z-index: 99999;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 7px 16px 7px 12px;
      border-radius: 999px;
      background: #067429;
      color: white;
      font-size: 13px;
      font-weight: 500;
      font-family: -apple-system, system-ui, sans-serif;
      box-shadow: 0 4px 20px rgba(0,0,0,0.24);
      pointer-events: none;
      white-space: nowrap;
      transform: translateX(-50%) translateY(-20px);
      opacity: 0;
      transition: none;
    `;
    el.innerHTML = `
      <svg id="pwa-ptr-icon" xmlns="http://www.w3.org/2000/svg"
           width="16" height="16" viewBox="0 0 24 24"
           fill="none" stroke="white" stroke-width="2.5"
           stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12a9 9 0 1 1-6.22-8.56"/>
        <polyline points="21 3 21 9 15 9"/>
      </svg>
      <span id="pwa-ptr-label">Pull to refresh</span>
    `;
    document.body.appendChild(el);

    const label = el.querySelector<HTMLElement>("#pwa-ptr-label")!;
    const icon  = el.querySelector<SVGElement>("#pwa-ptr-icon")!;

    function setIndicator(delta: number, spin: boolean): void {
      const p = Math.min(delta / THRESHOLD, 1);               // 0 → 1
      const ty = -20 + p * 24;                                // -20px → +4px
      el.style.transform = `translateX(-50%) translateY(${ty}px)`;
      el.style.opacity   = String(Math.min(p * 1.6, 1));
      label.textContent  = p >= 1 ? "Release to refresh" : "Pull to refresh";
      icon.style.animation = spin ? "pwa-ptr-spin 0.7s linear infinite" : "none";
      if (!spin) icon.style.transform = `rotate(${p * 300}deg)`;
    }

    function hide(): void {
      el.style.transition = "transform 0.22s ease, opacity 0.2s ease";
      el.style.transform  = "translateX(-50%) translateY(-20px)";
      el.style.opacity    = "0";
    }

    /* ── Touch handlers ─────────────────────────────────────────────── */
    function onTouchStart(e: TouchEvent): void {
      if (reloading) return;
      // Use scrollingElement for cross-browser accuracy on iOS
      const scrollTop =
        document.scrollingElement?.scrollTop ??
        document.documentElement.scrollTop ??
        window.scrollY;
      if (scrollTop > 2) return;
      startY     = e.touches[0].clientY;
      lastDelta  = 0;
      isDragging = true;
      el.style.transition = "none";
    }

    function onTouchMove(e: TouchEvent): void {
      if (!isDragging || reloading) return;
      const delta = e.touches[0].clientY - startY;
      if (delta <= 0) {
        isDragging = false;
        hide();
        return;
      }
      lastDelta = delta;
      setIndicator(delta, false);
    }

    function onTouchEnd(): void {
      if (!isDragging || reloading) return;
      isDragging = false;
      if (lastDelta >= THRESHOLD) {
        reloading = true;
        setIndicator(THRESHOLD, true);
        el.style.transition = "none";
        setTimeout(() => window.location.reload(), 500);
      } else {
        hide();
      }
    }

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove",  onTouchMove,  { passive: true });
    window.addEventListener("touchend",   onTouchEnd,   { passive: true });

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove",  onTouchMove);
      window.removeEventListener("touchend",   onTouchEnd);
      el.remove();
    };
  }, []);
}
