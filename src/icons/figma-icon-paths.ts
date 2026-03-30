import chevronRight from "@/assets/icons/figma/lucide/chevron-right.svg";
import xIcon from "@/assets/icons/figma/lucide/x.svg";
import archiveRestore from "@/assets/icons/figma/lucide/archive-restore.svg";
import squarePen from "@/assets/icons/figma/lucide/square-pen.svg";
import chevronDown from "@/assets/icons/figma/lucide/chevron-down.svg";
import trash2 from "@/assets/icons/figma/lucide/trash-2.svg";
import calendarDays from "@/assets/icons/figma/lucide/calendar-days.svg";
import house from "@/assets/icons/figma/lucide/house.svg";
import info from "@/assets/icons/figma/lucide/info.svg";
import search from "@/assets/icons/figma/misc/search.svg";
import userStar01 from "@/assets/icons/figma/misc/user-star-01.svg";
import tb10LogoFrame8 from "@/assets/icons/figma/misc/tb10-logo-frame8.svg";
import arrowRightGreen from "@/assets/icons/figma/misc/arrow-right-green.svg";

import userLinear from "@/assets/icons/figma/vuesax/linear/user.svg";
import chartBold from "@/assets/icons/figma/vuesax/bold/chart.svg";
import cupBold from "@/assets/icons/figma/vuesax/bold/cup.svg";
import infoCircleBold from "@/assets/icons/figma/vuesax/bold/info-circle.svg";
import peopleBold from "@/assets/icons/figma/vuesax/bold/people.svg";
import scanBarcodeBold from "@/assets/icons/figma/vuesax/bold/scan-barcode.svg";
import setting2Bold from "@/assets/icons/figma/vuesax/bold/setting-2.svg";
import shieldTickBold from "@/assets/icons/figma/vuesax/bold/shield-tick.svg";

import cloudUpload from "@/assets/icons/figma/lucide/cloud-upload.svg";
import circlePlus from "@/assets/icons/figma/lucide/circle-plus.svg";
import penLine from "@/assets/icons/figma/lucide/pen-line.svg";
import crown from "@/assets/icons/figma/lucide/crown.svg";
import plus from "@/assets/icons/figma/lucide/plus.svg";
import ellipsisVertical from "@/assets/icons/figma/lucide/ellipsis-vertical.svg";
import gripVertical from "@/assets/icons/figma/lucide/grip-vertical.svg";
import bell from "@/assets/icons/figma/lucide/bell.svg";

export const figmaIconPaths = {
  chevronRight,
  xIcon,
  archiveRestore,
  squarePen,
  chevronDown,
  trash2,
  calendarDays,
  house,
  info,
  search,
  userStar01,
  tb10LogoFrame8,
  arrowRightGreen,
  userLinear,
  chartBold,
  cupBold,
  infoCircleBold,
  peopleBold,
  scanBarcodeBold,
  setting2Bold,
  shieldTickBold,
  cloudUpload,
  circlePlus,
  penLine,
  crown,
  plus,
  ellipsisVertical,
  gripVertical,
  bell,
} as const;

export type FigmaIconPathKey = keyof typeof figmaIconPaths;
