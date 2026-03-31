import * as React from "react";
import { figmaIconPaths, type FigmaIconPathKey } from "@/icons/figma-icon-paths";
import { figmaIconClassName, type FigmaIconTone } from "@/icons/figma-icon-utils";

type Size = number | string;

type BaseImgProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "alt" | "width" | "height">;

type DecorativeIconProps = {
  decorative: true;
  title?: string;
};

type RequiredLabelIconProps = {
  decorative?: false;
  title: string;
};

export type FigmaIconProps = BaseImgProps & {
  name: FigmaIconPathKey;
  size?: Size;
  tone?: FigmaIconTone;
} & (DecorativeIconProps | RequiredLabelIconProps);

function normalizeSize(size: Size): { width: Size; height: Size } {
  return { width: size, height: size };
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
    const alt = decorative ? "" : title;

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
