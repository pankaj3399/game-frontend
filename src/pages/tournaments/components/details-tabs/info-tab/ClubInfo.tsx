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
    <div className="mt-[30px] border-t border-[#dddddd] pt-[25px]">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] bg-[#010a04]/[0.04] px-[15px] py-3">
        <div className="flex min-w-0 items-center gap-[15px]">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[20px] bg-[#dddddd]">
            <UserCircle2 size={30} className="text-[#010a04]" />
          </div>
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <p className="min-w-0 break-words text-[16px] font-medium leading-5 text-[#010a04]">
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
            <p className="text-[14px] leading-[18px] text-[#6a6a6a]">{t("tournaments.club")}</p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={!onGetDirection}
          onClick={onGetDirection}
          className="group h-[34px] gap-[10px] rounded-[8px] border-0 bg-white px-[15px] py-2 text-[14px] font-medium text-[#010a04] shadow-[0_0_4px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.06)] transition-[transform,box-shadow,background-color] duration-200 ease-out hover:-translate-y-px hover:bg-[#f7f8fa] hover:text-[#010a04] hover:shadow-[0_2px_10px_rgba(0,0,0,0.07),0_6px_16px_rgba(0,0,0,0.08)] active:translate-y-0 active:shadow-[0_0_4px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.06)] disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-50 disabled:shadow-[0_0_4px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.06)]"
        >
          <Compass size={18} className="text-[#010a04] transition-transform duration-200 ease-out group-hover:scale-[1.04]" />
          {t("tournaments.getDirection")}
        </Button>
      </div>
    </div>
  );
}
