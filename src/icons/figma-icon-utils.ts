import type { FigmaIconPathKey } from "@/icons/figma-icon-paths";

export type FigmaIconTone = "default" | "muted" | "subtle" | "white" | "danger" | "success" | "custom";

/** SVGs that already encode brand/colors; do not force monochrome silhouette. */
const NATURAL_COLOR_ICONS = new Set<FigmaIconPathKey>(["arrowRightGreen", "crown"]);

/** Infer tone from Tailwind text-* classes on the icon (img does not inherit `color`). */
export function toneFromClass(className?: string): FigmaIconTone {
  const c = className ?? "";
  if (c.includes("text-white")) return "white";
  if (c.includes("text-muted-foreground")) return "muted";
  if (c.includes("text-destructive")) return "danger";
  return "default";
}

function isNaturalColor(name: FigmaIconPathKey): boolean {
  return NATURAL_COLOR_ICONS.has(name);
}

function classesForTone(
  name: FigmaIconPathKey,
  tone: FigmaIconTone,
  className?: string,
): string {
  const natural = isNaturalColor(name);

  if (natural) {
    if (tone === "white") {
      return ["brightness-0 invert", className].filter(Boolean).join(" ");
    }
    if (tone === "muted") return ["opacity-60", className].filter(Boolean).join(" ");
    if (tone === "subtle") return ["opacity-50", className].filter(Boolean).join(" ");
    if (tone === "danger") {
      return ["hue-rotate-[330deg] saturate-[2] brightness-90", className].filter(Boolean).join(" ");
    }
    if (tone === "success") {
      return ["hue-rotate-[80deg] saturate-[1.5] brightness-95", className].filter(Boolean).join(" ");
    }
    return className ?? "";
  }

  switch (tone) {
    case "default":
      return ["brightness-0", className].filter(Boolean).join(" ");
    case "muted":
      return ["brightness-0 opacity-60", className].filter(Boolean).join(" ");
    case "subtle":
      return ["brightness-0 opacity-50", className].filter(Boolean).join(" ");
    case "white":
      return ["brightness-0 invert", className].filter(Boolean).join(" ");
    case "danger":
      return ["brightness-0 hue-rotate-[330deg] saturate-[2] brightness-90", className].filter(Boolean).join(" ");
    case "success":
      return ["brightness-0 hue-rotate-[80deg] saturate-[1.5] brightness-95", className].filter(Boolean).join(" ");
    case "custom":
      return className ?? "";
    default:
      return ["brightness-0", className].filter(Boolean).join(" ");
  }
}

export function figmaIconClassName(
  name: FigmaIconPathKey,
  tone: FigmaIconTone = "default",
  className?: string,
): string {
  return classesForTone(name, tone, className);
}
