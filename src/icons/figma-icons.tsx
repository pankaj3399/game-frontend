import * as React from "react";
import FigmaIcon from "@/icons/FigmaIcon";
import { toneFromClass, type FigmaIconTone } from "./figma-icon-utils";
import Apple from "@/assets/icons/Apple";
import Google from "@/assets/icons/Google";

/**
 * Figma-backed icons: one component per asset, with optional CSS transform for arrows.
 * Use Tailwind `text-white`, `text-muted-foreground`, etc. on the icon so tone matches the surface
 * (img elements do not inherit `color` from parents).
 */

type Size = number | string;
type ImgProps = Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "src" | "alt"
> & {
  size?: Size;
  title?: string;
  strokeWidth?: number | string;
  absoluteStrokeWidth?: boolean;
  color?: string;
};

type FigmaName = Parameters<typeof FigmaIcon>[0]["name"];

type CreateIconOptions = {
  defaultTone?: FigmaIconTone;
  transform?: string;
};

const withSize = (size?: Size): Size => size ?? 16;

function resolveTone(className: string | undefined, defaultTone: FigmaIconTone): FigmaIconTone {
  const fromClass = toneFromClass(className);
  if (fromClass !== "default") return fromClass;

  if (!className) return defaultTone;

  // Detect Tailwind arbitrary color classes like: text-[#d92100], text-[rgb(217,33,0)], text-[var(--my-color)]
  const customColorPattern = /text-\[(?:#|rgb|rgba|hsl|hsla|var)[^\]]+\]/;
  if (customColorPattern.test(className)) return "custom";

  return defaultTone;
}

function createIcon(
  name: FigmaName,
  defaultOrOptions?: FigmaIconTone | CreateIconOptions,
) {
  const options: CreateIconOptions =
    typeof defaultOrOptions === "string"
      ? { defaultTone: defaultOrOptions }
      : defaultOrOptions ?? {};

  const defaultTone = options.defaultTone ?? "default";
  const transform = options.transform;

  const Comp = React.forwardRef<HTMLImageElement, ImgProps>((props, ref) => {
    const {
      size,
      className,
      title,
      style,
      ...rest
    } = props;
    const tone = resolveTone(className, defaultTone);

    const inner = (
      <FigmaIcon
        ref={ref}
        name={name}
        tone={tone}
        size={withSize(size)}
        className={className}
        title={title}
        decorative={!title}
        style={style}
        {...rest}
      />
    );

    if (transform) {
      return (
        <span
          className="inline-flex shrink-0 items-center justify-center"
          style={{ transform }}
        >
          {inner}
        </span>
      );
    }

    return inner;
  });
  return Comp;
}

/* -------------------------------------------------------------------------- */
/* Core direct icons                                                           */
/* -------------------------------------------------------------------------- */

export const IconChart = createIcon("chartBold");
export const IconCup = createIcon("cupBold");
export const IconScanBarcode = createIcon("scanBarcodeBold");
export const IconSetting = createIcon("setting2Bold");
export const IconPeople = createIcon("peopleBold");
export const IconShieldTick = createIcon("shieldTickBold");
export const IconInfoCircle = createIcon("infoCircleBold");
export const IconUser = createIcon("userLinear");
export const IconUserStar = createIcon("userStar01");

export const IconChevronDown = createIcon("chevronDown", { defaultTone: "muted" });
export const IconChevronRight = createIcon("chevronRight", { defaultTone: "muted" });
export const IconChevronLeft = createIcon("chevronRight", { defaultTone: "muted",transform: "scaleX(-1)" });
export const IconArrowRight = createIcon("arrowRightGreen");

export const IconCalendarDays = createIcon("calendarDays", { defaultTone: "muted" });
export const IconSquarePen = createIcon("squarePen", { defaultTone: "muted" });
export const IconPenLine = createIcon("penLine", { defaultTone: "muted" });
export const IconTrash = createIcon("trash2", { defaultTone: "muted" });
export const IconX = createIcon("xIcon", { defaultTone: "muted" });

export const IconCloudUpload = createIcon("cloudUpload", { defaultTone: "muted" });
export const IconCirclePlus = createIcon("circlePlus", { defaultTone: "muted" });
export const IconPlus = createIcon("plus", { defaultTone: "muted" });
export const IconCrown = createIcon("crown", { defaultTone: "muted" });

export const IconEllipsisVertical = createIcon("ellipsisVertical", { defaultTone: "muted" });
export const IconGripVertical = createIcon("gripVertical", { defaultTone: "muted" });
export const IconBell = createIcon("bell", { defaultTone: "muted" });

export const IconHouse = createIcon("house", { defaultTone: "muted" });
export const IconInfo = createIcon("info", { defaultTone: "muted" });
export const IconSearch = createIcon("search", { defaultTone: "muted" });
export const IconArchiveRestore = createIcon("archiveRestore", { defaultTone: "muted" });

export const IconTb10Logo = createIcon("tb10LogoFrame8");

/* -------------------------------------------------------------------------- */
/* Semantic aliases requested in app flows                                     */
/* -------------------------------------------------------------------------- */

export const IconNavbarUser = IconUserStar;
export const IconMyScore = IconChart;

/* -------------------------------------------------------------------------- */
/* Named icons (former Hugeicons token names)                                  */
/* -------------------------------------------------------------------------- */

export const Menu01Icon = createIcon("scanBarcodeBold");
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

/* -------------------------------------------------------------------------- */
/* Former Lucide-like API names (used across app/ui)                          */
/* -------------------------------------------------------------------------- */

export const XIcon = IconX;
export const X = IconX;

export const ChevronDownIcon = IconChevronDown;
export const ChevronDown = IconChevronDown;

export const ChevronRightIcon = IconChevronRight;
export const ChevronRight = IconChevronRight;

export const ChevronLeftIcon = IconChevronLeft;
export const ChevronLeft = IconChevronLeft;
export const ChevronUp = createIcon("chevronDown",{ defaultTone: "muted", transform: "rotate(180deg)"});

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

/* -------------------------------------------------------------------------- */
/* Former react-icons specific exports used by app                             */
/* -------------------------------------------------------------------------- */

export const FcGoogle = Google;
export const SiApple = Apple;

/* -------------------------------------------------------------------------- */
/* Dynamic map                                                                  */
/* -------------------------------------------------------------------------- */

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
  tb10Logo: IconTb10Logo,
  navbarUser: IconNavbarUser,
  myScore: IconMyScore,
} as const;

export type FigmaIconKey = keyof typeof FIGMA_ICONS;
