/**
 * Navbar-only icons — avoid importing `@/icons/figma-icons` on the critical path
 * (that barrel eagerly pulls every SVG in the set).
 */
import * as React from "react";

import alignRightIcon from "@/assets/icons/figma/lucide/align-right.svg?react";
import chevronDownIcon from "@/assets/icons/figma/lucide/chevron-down.svg?react";
import chartBoldIcon from "@/assets/icons/figma/vuesax/bold/chart.svg?react";
import cupBoldIcon from "@/assets/icons/figma/vuesax/bold/cup.svg?react";
import infoCircleBoldIcon from "@/assets/icons/figma/vuesax/bold/info-circle.svg?react";
import peopleBoldIcon from "@/assets/icons/figma/vuesax/bold/people.svg?react";
import scanBarcodeBoldIcon from "@/assets/icons/figma/vuesax/bold/scan-barcode.svg?react";
import setting2BoldIcon from "@/assets/icons/figma/vuesax/bold/setting-2.svg?react";
import shieldTickBoldIcon from "@/assets/icons/figma/vuesax/bold/shield-tick.svg?react";
import userStar01Icon from "@/assets/icons/figma/misc/user-star-01.svg?react";

type Size = number | string;

export type NavIconProps = Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> & {
  size?: Size;
  title?: string;
};

type SvgIconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;

function toCssSize(size: Size | undefined): string | undefined {
  if (size === undefined) return undefined;
  return typeof size === "number" ? `${size}px` : size;
}

function createNavIcon(
  Svg: SvgIconComponent,
  displayName: string,
  transform?: string,
) {
  const Component = React.forwardRef<HTMLSpanElement, NavIconProps>((props, ref) => {
    const {
      size,
      className,
      title,
      style,
      role,
      "aria-label": ariaLabel,
      "aria-hidden": ariaHidden,
      ...rest
    } = props;

    const iconSize = toCssSize(size);
    const explicitDimensions =
      iconSize !== undefined
        ? { width: iconSize, height: iconSize }
        : { width: "100%" as const, height: "100%" as const };

    const icon = (
      <span
        ref={ref}
        className={["inline-flex shrink-0 items-center justify-center align-middle", className]
          .filter(Boolean)
          .join(" ")}
        style={{
          ...(iconSize !== undefined ? { width: iconSize, height: iconSize } : {}),
          lineHeight: 0,
          ...style,
        }}
        title={title}
        role={role ?? (title ? "img" : undefined)}
        aria-label={ariaLabel ?? (title ? title : undefined)}
        aria-hidden={ariaHidden ?? (title ? undefined : true)}
        {...rest}
      >
        <Svg
          {...explicitDimensions}
          className="block size-full"
          preserveAspectRatio="xMidYMid meet"
          focusable={false}
          aria-hidden={true}
        />
      </span>
    );

    if (!transform) return icon;

    return (
      <span className="inline-flex shrink-0 items-center justify-center" style={{ transform }}>
        {icon}
      </span>
    );
  });

  Component.displayName = displayName;
  return Component;
}

export const Menu01Icon = createNavIcon(alignRightIcon, "Menu01Icon");
export const Award01Icon = createNavIcon(cupBoldIcon, "Award01Icon");
export const ChartIcon = createNavIcon(chartBoldIcon, "ChartIcon");
export const PeopleIcon = createNavIcon(peopleBoldIcon, "PeopleIcon");
export const ClipboardIcon = createNavIcon(scanBarcodeBoldIcon, "ClipboardIcon");
export const Settings01Icon = createNavIcon(setting2BoldIcon, "Settings01Icon");
export const ShieldIcon = createNavIcon(shieldTickBoldIcon, "ShieldIcon");
export const InformationCircleIcon = createNavIcon(
  infoCircleBoldIcon,
  "InformationCircleIcon",
);
export const ArrowDown01Icon = createNavIcon(chevronDownIcon, "ArrowDown01Icon");
export const UserIcon = createNavIcon(userStar01Icon, "UserIcon");
