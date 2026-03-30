import * as React from "react";
import { figmaIconPaths, type FigmaIconPathKey } from "@/icons/figma-icon-paths";

type Size = number | string;

/** SVGs that already encode brand/colors; do not force monochrome silhouette. */
const NATURAL_COLOR_ICONS = new Set<FigmaIconPathKey>(["arrowRightGreen", "crown"]);

export type FigmaIconTone = "default" | "muted" | "subtle" | "white" | "danger" | "success";

export interface FigmaIconProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "alt" | "width" | "height"> {
  name: FigmaIconPathKey;
  size?: Size;
  tone?: FigmaIconTone;
  decorative?: boolean;
  title?: string;
}

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
    default:
      return ["brightness-0", className].filter(Boolean).join(" ");
  }
}

function normalizeSize(size: Size): { width: Size; height: Size } {
  return { width: size, height: size };
}

export function figmaIconClassName(
  name: FigmaIconPathKey,
  tone: FigmaIconTone = "default",
  className?: string,
): string {
  return classesForTone(name, tone, className);
}

const FigmaIcon = React.forwardRef<HTMLImageElement, FigmaIconProps>(
  (
    {
      name,
      size = 16,
      tone = "default",
      className,
      decorative = true,
      title,
      draggable = false,
      loading = "lazy",
      decoding = "async",
      ...rest
    },
    ref,
  ) => {
    const src = figmaIconPaths[name];
    const { width, height } = normalizeSize(size);
    const composedClassName = figmaIconClassName(name, tone, className);

    const ariaHidden = decorative ? true : undefined;
    const role = decorative ? undefined : "img";
    const alt = decorative ? "" : title || name;

    return (
      <img
        ref={ref}
        src={src}
        width={width}
        height={height}
        alt={alt}
        aria-hidden={ariaHidden}
        role={role}
        title={title}
        className={composedClassName}
        draggable={draggable}
        loading={loading}
        decoding={decoding}
        {...rest}
      />
    );
  },
);

FigmaIcon.displayName = "FigmaIcon";

export default FigmaIcon;
