import * as React from "react";

import Apple from "@/assets/icons/Apple";
import Google from "@/assets/icons/Google";

import archiveRestoreIcon from "@/assets/icons/figma/lucide/archive-restore.svg?react";
import alignRightIcon from "@/assets/icons/figma/lucide/align-right.svg?react";
import bellIcon from "@/assets/icons/figma/lucide/bell.svg?react";
import calendarDaysIcon from "@/assets/icons/figma/lucide/calendar-days.svg?react";
import chevronDownIcon from "@/assets/icons/figma/lucide/chevron-down.svg?react";
import chevronRightIcon from "@/assets/icons/figma/lucide/chevron-right.svg?react";
import circlePlusIcon from "@/assets/icons/figma/lucide/circle-plus.svg?react";
import cloudUploadIcon from "@/assets/icons/figma/lucide/cloud-upload.svg?react";
import crownIconUrl from "@/assets/icons/figma/lucide/crown.svg";
import ellipsisVerticalIcon from "@/assets/icons/figma/lucide/ellipsis-vertical.svg?react";
import gripVerticalIcon from "@/assets/icons/figma/lucide/grip-vertical.svg?react";
import houseIcon from "@/assets/icons/figma/lucide/house.svg?react";
import infoIcon from "@/assets/icons/figma/lucide/info.svg?react";
import penLineIcon from "@/assets/icons/figma/lucide/pen-line.svg?react";
import plusIcon from "@/assets/icons/figma/lucide/plus.svg?react";
import squarePenIcon from "@/assets/icons/figma/lucide/square-pen.svg?react";
import trash2Icon from "@/assets/icons/figma/lucide/trash-2.svg?react";
import xIconSvg from "@/assets/icons/figma/lucide/x.svg?react";

import arrowRightGreenIcon from "@/assets/icons/figma/misc/arrow-right-green.svg?react";
import searchIcon from "@/assets/icons/figma/misc/search.svg?react";
import tb10LogoFrame8Url from "@/assets/icons/figma/misc/tb10-logo-frame8.svg";
import userStar01Icon from "@/assets/icons/figma/misc/user-star-01.svg?react";

import chartBoldIcon from "@/assets/icons/figma/vuesax/bold/chart.svg?react";
import cupBoldIcon from "@/assets/icons/figma/vuesax/bold/cup.svg?react";
import infoCircleBoldIcon from "@/assets/icons/figma/vuesax/bold/info-circle.svg?react";
import peopleBoldIcon from "@/assets/icons/figma/vuesax/bold/people.svg?react";
import scanBarcodeBoldIcon from "@/assets/icons/figma/vuesax/bold/scan-barcode.svg?react";
import setting2BoldIcon from "@/assets/icons/figma/vuesax/bold/setting-2.svg?react";
import shieldTickBoldIcon from "@/assets/icons/figma/vuesax/bold/shield-tick.svg?react";
import userLinearIcon from "@/assets/icons/figma/vuesax/linear/user.svg?react";

type Size = number | string;
type IconTone = "default" | "muted" | "subtle" | "white" | "danger" | "success";

type IconProps = Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> & {
  size?: Size;
  title?: string;
};

type SvgIconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;

type IconDefinition = {
  component?: SvgIconComponent;
  imageSrc?: string;
  defaultTone?: IconTone;
  nativeColor?: boolean;
  transform?: string;
};

const TONE_CLASS: Record<IconTone, string> = {
  default: "text-foreground",
  muted: "text-muted-foreground",
  subtle: "text-muted-foreground/70",
  white: "text-white",
  danger: "text-destructive",
  success: "text-emerald-600",
};

function toCssSize(size: Size | undefined): string {
  const safeSize = size ?? 16;
  return typeof safeSize === "number" ? `${safeSize}px` : safeSize;
}

function defineSvgIcon(component: SvgIconComponent, options?: Omit<IconDefinition, "component" | "imageSrc">): IconDefinition {
  const nativeColor = options?.nativeColor ?? false;

  return {
    component,
    defaultTone: options?.defaultTone,
    nativeColor,
    transform: options?.transform,
  };
}

function defineImageIcon(imageSrc: string, options?: Omit<IconDefinition, "component" | "imageSrc">): IconDefinition {
  const nativeColor = options?.nativeColor ?? true;

  return {
    imageSrc,
    defaultTone: options?.defaultTone,
    nativeColor,
    transform: options?.transform,
  };
}

const ICONS = {
  chartBold: defineSvgIcon(chartBoldIcon),
  cupBold: defineSvgIcon(cupBoldIcon),
  scanBarcodeBold: defineSvgIcon(scanBarcodeBoldIcon),
  setting2Bold: defineSvgIcon(setting2BoldIcon),
  peopleBold: defineSvgIcon(peopleBoldIcon),
  shieldTickBold: defineSvgIcon(shieldTickBoldIcon),
  infoCircleBold: defineSvgIcon(infoCircleBoldIcon),
  userLinear: defineSvgIcon(userLinearIcon),
  userStar01: defineSvgIcon(userStar01Icon),

  chevronDown: defineSvgIcon(chevronDownIcon, { defaultTone: "muted" }),
  chevronRight: defineSvgIcon(chevronRightIcon, { defaultTone: "muted" }),
  arrowRightGreen: defineSvgIcon(arrowRightGreenIcon),

  calendarDays: defineSvgIcon(calendarDaysIcon, { defaultTone: "muted" }),
  squarePen: defineSvgIcon(squarePenIcon, { defaultTone: "muted" }),
  penLine: defineSvgIcon(penLineIcon, { defaultTone: "muted" }),
  trash2: defineSvgIcon(trash2Icon, { defaultTone: "muted" }),
  xIcon: defineSvgIcon(xIconSvg, { defaultTone: "muted" }),

  cloudUpload: defineSvgIcon(cloudUploadIcon, { defaultTone: "muted" }),
  circlePlus: defineSvgIcon(circlePlusIcon, { defaultTone: "muted" }),
  plus: defineSvgIcon(plusIcon, { defaultTone: "muted" }),
  crown: defineImageIcon(crownIconUrl, { defaultTone: "muted", nativeColor: true }),

  ellipsisVertical: defineSvgIcon(ellipsisVerticalIcon, { defaultTone: "muted" }),
  gripVertical: defineSvgIcon(gripVerticalIcon, { defaultTone: "muted" }),
  bell: defineSvgIcon(bellIcon, { defaultTone: "muted" }),

  house: defineSvgIcon(houseIcon, { defaultTone: "muted" }),
  info: defineSvgIcon(infoIcon, { defaultTone: "muted" }),
  search: defineSvgIcon(searchIcon, { defaultTone: "muted" }),
  archiveRestore: defineSvgIcon(archiveRestoreIcon, { defaultTone: "muted" }),
  alignRight: defineSvgIcon(alignRightIcon, { defaultTone: "muted" }),
  tb10LogoFrame8: defineImageIcon(tb10LogoFrame8Url, { nativeColor: true }),
};

type IconKey = keyof typeof ICONS;

function createIcon(name: IconKey, override?: { defaultTone?: IconTone; transform?: string }) {
  const definition = ICONS[name];
  const defaultTone = override?.defaultTone ?? definition.defaultTone ?? "default";
  const transform = override?.transform ?? definition.transform;

  const Component = React.forwardRef<HTMLSpanElement, IconProps>((props, ref) => {
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
    const Svg = definition.component;

    const icon = (
      <span
        ref={ref}
        className={[
          "inline-flex shrink-0 align-middle",
          definition.nativeColor ? "" : TONE_CLASS[defaultTone],
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        style={{
          width: iconSize,
          height: iconSize,
          lineHeight: 0,
          ...style,
        }}
        title={title}
        role={role ?? (title ? "img" : undefined)}
        aria-label={ariaLabel ?? (title ? title : undefined)}
        aria-hidden={ariaHidden ?? (title ? undefined : true)}
        {...rest}
      >
        {Svg ? (
          <Svg
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMid meet"
            focusable={false}
            aria-hidden={true}
          />
        ) : (
          <img
            src={definition.imageSrc}
            alt=""
            width="100%"
            height="100%"
            draggable={false}
            aria-hidden={true}
          />
        )}
      </span>
    );

    if (!transform) {
      return icon;
    }

    return (
      <span
        className="inline-flex shrink-0 items-center justify-center"
        style={{ transform }}
      >
        {icon}
      </span>
    );
  });

  Component.displayName = `Icon(${name})`;
  return Component;
}

export const IconChart = createIcon("chartBold");
export const IconCup = createIcon("cupBold");
export const IconScanBarcode = createIcon("scanBarcodeBold");
export const IconSetting = createIcon("setting2Bold");
export const IconPeople = createIcon("peopleBold");
export const IconShieldTick = createIcon("shieldTickBold");
export const IconInfoCircle = createIcon("infoCircleBold");
export const IconUser = createIcon("userLinear");
export const IconUserStar = createIcon("userStar01");

export const IconChevronDown = createIcon("chevronDown");
export const IconChevronRight = createIcon("chevronRight");
export const IconChevronLeft = createIcon("chevronRight", { transform: "scaleX(-1)" });
export const IconArrowRight = createIcon("arrowRightGreen");

export const IconCalendarDays = createIcon("calendarDays");
export const IconSquarePen = createIcon("squarePen");
export const IconPenLine = createIcon("penLine");
export const IconTrash = createIcon("trash2");
export const IconX = createIcon("xIcon");

export const IconCloudUpload = createIcon("cloudUpload");
export const IconCirclePlus = createIcon("circlePlus");
export const IconPlus = createIcon("plus");
export const IconCrown = createIcon("crown");

export const IconEllipsisVertical = createIcon("ellipsisVertical");
export const IconGripVertical = createIcon("gripVertical");
export const IconBell = createIcon("bell");

export const IconHouse = createIcon("house");
export const IconInfo = createIcon("info");
export const IconSearch = createIcon("search");
export const IconArchiveRestore = createIcon("archiveRestore");
export const IconAlignRight = createIcon("alignRight");

export const IconTb10Logo = createIcon("tb10LogoFrame8");

export const IconNavbarUser = IconUserStar;
export const IconMyScore = IconChart;

export const Menu01Icon = IconAlignRight;
export const Award01Icon = createIcon("cupBold");
export const ChartIcon = createIcon("chartBold");
export const PeopleIcon = createIcon("peopleBold");
export const ClipboardIcon = createIcon("scanBarcodeBold");
export const Settings01Icon = createIcon("setting2Bold");
export const ShieldIcon = createIcon("shieldTickBold");
export const InformationCircleIcon = createIcon("infoCircleBold");
export const ArrowDown01Icon = createIcon("chevronDown");
export const ArrowUp01Icon = createIcon("arrowRightGreen", { transform: "rotate(180deg)" });
export const ArrowLeft01Icon = createIcon("arrowRightGreen", { transform: "scaleX(-1)" });
export const ArrowRight01Icon = createIcon("arrowRightGreen");
export const UserIcon = createIcon("userStar01");
export const Logout01Icon = createIcon("archiveRestore");
export const Search01Icon = createIcon("search");
export const CrownIcon = createIcon("crown");
export const Calendar03Icon = createIcon("calendarDays");
export const CheckmarkCircle01Icon = createIcon("infoCircleBold");
export const Delete01Icon = createIcon("trash2");
export const Delete02Icon = createIcon("trash2");
export const DragDropVerticalIcon = createIcon("gripVertical");
export const Mail01Icon = createIcon("infoCircleBold");
export const PencilEdit01Icon = createIcon("penLine");
export const PencilIcon = createIcon("penLine");
export const PlusSignIcon = createIcon("plus");
export const Upload01Icon = createIcon("cloudUpload");
export const ViewIcon = createIcon("userStar01");
export const MoreVerticalIcon = createIcon("ellipsisVertical");

export const XIcon = IconX;
export const X = IconX;

export const ChevronDownIcon = IconChevronDown;
export const ChevronDown = IconChevronDown;

export const ChevronRightIcon = IconChevronRight;
export const ChevronRight = IconChevronRight;

export const ChevronLeftIcon = IconChevronLeft;
export const ChevronLeft = IconChevronLeft;
export const ChevronUp = createIcon("chevronDown", { transform: "rotate(180deg)" });

export const Trash2 = IconTrash;
export const CalendarDays = IconCalendarDays;
export const Calendar = IconCalendarDays;
export const House = IconHouse;
export const Info = IconInfo;

export const CheckIcon = IconInfoCircle;
export const CircleIcon = IconInfoCircle;
export const MoreHorizontal = IconEllipsisVertical;
export const Clock = IconArchiveRestore;
export const Clock3 = IconArchiveRestore;

export const CloudUpload = IconCloudUpload;
export const CirclePlus = IconCirclePlus;
export const PenLine = IconPenLine;
export const Pencil = IconPenLine;

export const ArrowRight = IconArrowRight;
export const MapPin = IconInfoCircle;
export const Globe = IconInfoCircle;
export const Eye = IconUserStar;
export const Crown = IconCrown;
export const Rocket = IconArchiveRestore;
export const Check = IconInfoCircle;
export const Circle = IconInfoCircle;
export const UserCircle2 = IconUserStar;
export const Users = IconPeople;
export const UsersRound = IconPeople;
export const Compass = IconInfoCircle;
export const Tag = IconInfoCircle;
export const Share2 = IconArchiveRestore;
export const Trophy = IconCup;
export const Timer = IconArchiveRestore;
export const Minus = IconArchiveRestore;
export const ExternalLink = IconArrowRight;

export const CheckCircle2 = IconInfoCircle;
export const CircleCheckIcon = IconInfoCircle;
export const InfoIcon = IconInfo;
export const OctagonXIcon = IconX;
export const TriangleAlertIcon = IconInfo;

export const FcGoogle = Google;
export const SiApple = Apple;

export const FIGMA_ICONS = {
  chart: IconChart,
  cup: IconCup,
  scanBarcode: IconScanBarcode,
  setting: IconSetting,
  people: IconPeople,
  shieldTick: IconShieldTick,
  infoCircle: IconInfoCircle,
  user: IconUser,
  userStar: IconUserStar,
  chevronDown: IconChevronDown,
  chevronRight: IconChevronRight,
  chevronLeft: IconChevronLeft,
  arrowRight: IconArrowRight,
  calendarDays: IconCalendarDays,
  squarePen: IconSquarePen,
  penLine: IconPenLine,
  trash: IconTrash,
  x: IconX,
  cloudUpload: IconCloudUpload,
  circlePlus: IconCirclePlus,
  plus: IconPlus,
  crown: IconCrown,
  ellipsisVertical: IconEllipsisVertical,
  gripVertical: IconGripVertical,
  bell: IconBell,
  house: IconHouse,
  info: IconInfo,
  search: IconSearch,
  archiveRestore: IconArchiveRestore,
  alignRight: IconAlignRight,
  tb10Logo: IconTb10Logo,
  navbarUser: IconNavbarUser,
  myScore: IconMyScore,
};

export type FigmaIconKey = keyof typeof FIGMA_ICONS;
