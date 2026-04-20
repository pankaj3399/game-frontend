import { Button } from "@/components/ui/button";
import { Compass, Pencil, UserCircle2 } from "@/icons/figma-icons";
import type { TFunction } from "i18next";

interface ClubInfoProps {
  clubName: string;
  canEdit: boolean;
  onEdit: () => void;
  /** When omitted, directions is disabled (e.g. no club to navigate to). */
  onGetDirection?: () => void;
  t: TFunction;
}

export function ClubInfo({ clubName, canEdit, onEdit, onGetDirection, t }: ClubInfoProps) {
  return (
    <div className="mt-6 border-t border-[#dddddd] pt-5 sm:mt-[30px] sm:pt-[25px]">
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-[12px] bg-[#010a04]/[0.04] px-3 py-2.5 sm:gap-3 sm:px-[15px] sm:py-3">
        <div className="flex min-w-0 items-center gap-3 sm:gap-[15px]">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[18px] bg-[#dddddd] sm:h-10 sm:w-10 sm:rounded-[20px]">
            <UserCircle2 className="h-[26px] w-[26px] text-[#010a04] sm:h-[30px] sm:w-[30px]" />
          </div>
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <p className="min-w-0 break-words text-[14px] font-medium leading-snug text-[#010a04] sm:text-[16px] sm:leading-5">
                {clubName}
              </p>
              {canEdit && (
                <button
                  type="button"
                  aria-label={t("tournaments.editInfo")}
                  className="flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border border-black/15"
                  onClick={onEdit}
                >
                  <Pencil size={12} className="text-[#010a04]" />
                </button>
              )}
            </div>
            <p className="mt-0.5 text-[12px] leading-[16px] text-[#6a6a6a] sm:mt-1 sm:text-[14px] sm:leading-[18px]">
              {t("tournaments.club")}
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={!onGetDirection}
          onClick={onGetDirection}
          className="group h-8 gap-2 rounded-[8px] border-0 bg-white px-3 py-1.5 text-[13px] font-medium text-[#010a04] shadow-[0_0_4px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.06)] transition-[transform,box-shadow,background-color] duration-200 ease-out hover:-translate-y-px hover:bg-[#f7f8fa] hover:text-[#010a04] hover:shadow-[0_2px_10px_rgba(0,0,0,0.07),0_6px_16px_rgba(0,0,0,0.08)] active:translate-y-0 active:shadow-[0_0_4px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.06)] disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-50 disabled:shadow-[0_0_4px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.06)] sm:h-[34px] sm:gap-[10px] sm:px-[15px] sm:py-2 sm:text-[14px]"
        >
          <Compass className="h-4 w-4 shrink-0 text-[#010a04] transition-transform duration-200 ease-out group-hover:scale-[1.04] sm:h-[18px] sm:w-[18px]" />
          {t("tournaments.getDirection")}
        </Button>
      </div>
    </div>
  );
}
