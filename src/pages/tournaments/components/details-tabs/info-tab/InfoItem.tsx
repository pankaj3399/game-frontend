import type { ComponentType } from "react";
import type { IconProps } from "@/icons/figma-icons";

type FigmaIconComponent = ComponentType<IconProps>;

interface InfoItemProps {
  icon: FigmaIconComponent;
  label: string;
  value: string;
  valueClassName?: string;
}

export function InfoItem({ icon: Icon, label, value, valueClassName }: InfoItemProps) {
  return (
    <div className="flex items-start gap-3 sm:gap-6">
      <Icon aria-hidden className="mt-[1px] h-5 w-5 shrink-0 text-[#010a04] sm:h-6 sm:w-6" />
      <div className="min-w-0">
        <p
          className={`text-[14px] font-medium leading-snug text-[#010a04] sm:text-[16px] sm:leading-5 ${valueClassName ?? ""}`.trim()}
        >
          {value}
        </p>
        <p className="text-[12px] leading-snug text-[#010a04]/60 sm:text-[14px] sm:leading-5">{label}</p>
      </div>
    </div>
  );
}
