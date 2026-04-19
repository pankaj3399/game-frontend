import { useId } from "react";
import { ChevronDown, ChevronUp } from "@/icons/figma-icons";
import type { TFunction } from "i18next";

interface DescriptionSectionProps {
  title: string;
  descriptionDisplay: string;
  hasDescription: boolean;
  isCollapsible: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  t: TFunction;
}

export function DescriptionSection({
  title,
  descriptionDisplay,
  hasDescription,
  isCollapsible,
  isExpanded,
  onToggle,
  t,
}: DescriptionSectionProps) {
  const idPrefix = useId();
  const headingId = `${idPrefix}-heading`;
  const descriptionId = `${idPrefix}-description`;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between sm:mb-[17px]">
        <h2
          className="text-[17px] font-semibold leading-snug text-[#010a04] sm:text-[20px] sm:leading-normal"
          id={headingId}
        >
          {title}
        </h2>
        {isCollapsible ? (
          <button
            type="button"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] border border-[#010a04]/25 text-[#010a04] transition-colors hover:bg-[#010a04]/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#010a04]/25"
            aria-expanded={isExpanded}
            aria-controls={descriptionId}
            aria-label={isExpanded ? t("tournaments.collapseDescription") : t("tournaments.expandDescription")}
            onClick={onToggle}
          >
            {isExpanded ? (
              <ChevronUp size={16} className="text-[#010a04]" aria-hidden />
            ) : (
              <ChevronDown size={16} className="text-[#010a04]" aria-hidden />
            )}
          </button>
        ) : null}
      </div>

      <div className="space-y-4 text-[14px] leading-snug sm:space-y-[18px] sm:text-[16px] sm:leading-5">
        <p
          id={descriptionId}
          className={`whitespace-pre-line ${hasDescription ? "text-[#010a04]" : "text-[#010a04]/60"}`}
          aria-labelledby={headingId}
        >
          {descriptionDisplay}
        </p>
      </div>
    </div>
  );
}
