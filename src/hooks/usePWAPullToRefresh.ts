import { useEffect } from "react";
import PullToRefresh from "pulltorefreshjs";

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

export function usePWAPullToRefresh(): void {
  useEffect(() => {
    if (!isIOS() || !isStandalone()) return;

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
        return (
          Math.max(
            document.documentElement.scrollTop,
            document.body.scrollTop,
            window.scrollY
          ) <= 0
        );
      },

      instructionsPullToRefresh: "",
      instructionsReleaseToRefresh: "",
      instructionsRefreshing: "",

      iconArrow: ICON_PULL,
      iconRefreshing: ICON_SPIN,
    });

    return () => {
      PullToRefresh.destroyAll();
    };
  }, []);
}
