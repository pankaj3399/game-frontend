/** Icons used by TournamentTable — keep the figma-icons barrel off the list chunk. */
import * as React from "react";
import calendarTickLinearIcon from "@/assets/icons/figma/vuesax/linear/calendar-tick.svg?react";
import penLineIcon from "@/assets/icons/figma/lucide/pen-line.svg?react";

type Size = number | string;
type IconProps = Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> & {
  size?: Size;
  title?: string;
};

type SvgIconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;

function toCssSize(size: Size | undefined): string | undefined {
  if (size === undefined) return undefined;
  return typeof size === "number" ? `${size}px` : size;
}

function createIcon(Svg: SvgIconComponent, displayName: string) {
  const Component = React.forwardRef<HTMLSpanElement, IconProps>((props, ref) => {
    const { size, className, title, style, role, "aria-label": ariaLabel, "aria-hidden": ariaHidden, ...rest } =
      props;
    const iconSize = toCssSize(size);
    const dims =
      iconSize !== undefined
        ? { width: iconSize, height: iconSize }
        : { width: "100%" as const, height: "100%" as const };
    return (
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
          {...dims}
          className="block size-full"
          preserveAspectRatio="xMidYMid meet"
          focusable={false}
          aria-hidden={true}
        />
      </span>
    );
  });
  Component.displayName = displayName;
  return Component;
}

const EyeSvgIcon = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  (props, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
);
EyeSvgIcon.displayName = "EyeSvgIcon";

export const Calendar = createIcon(calendarTickLinearIcon, "Calendar");
export const PencilEdit01Icon = createIcon(penLineIcon, "PencilEdit01Icon");
export const EyeIcon = createIcon(EyeSvgIcon, "EyeIcon");
