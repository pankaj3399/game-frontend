import { useTranslation } from "react-i18next";
import { Delete01Icon } from "@/icons/figma-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CourtInput, CourtPlacement, CourtType } from "@/pages/clubs/hooks";

interface ClubCourtsEditorProps {
  courts: CourtInput[];
  courtTypes: CourtType[];
  courtPlacements: CourtPlacement[];
  onAddCourt: () => void;
  onRemoveCourt: (index: number) => void;
  onCourtChange: (index: number, field: keyof CourtInput, value: string) => void;
}

export function ClubCourtsEditor({
  courts,
  courtTypes,
  courtPlacements,
  onAddCourt,
  onRemoveCourt,
  onCourtChange,
}: ClubCourtsEditorProps) {
  const { t } = useTranslation();

  const courtInputClassName =
    "h-[34px] rounded-[8px] border-[#e1e3e8] bg-[#f9fafc] px-2 text-xs shadow-none placeholder:text-[#010a04]/50 focus-visible:ring-0 sm:h-[38px] sm:px-3 sm:text-sm";
  const courtSelectClassName =
    "h-[34px] w-full rounded-[8px] border-[#e1e3e8] bg-[#f9fafc] px-1.5 text-xs font-medium text-[#010a04] shadow-none focus-visible:ring-0 [&_svg]:size-3 sm:h-[38px] sm:px-2 sm:text-[13px] sm:[&_svg]:size-3.5";

  return (
    <div className="space-y-2 rounded-[12px] sm:space-y-[10px]">
      <Label className="text-sm font-medium text-[#010a04] sm:text-base">
        {t("settings.adminClubsAllCourts")}
      </Label>
      <div className="space-y-2 sm:space-y-[9px]">
        <div className="grid grid-cols-[minmax(0,128px)_minmax(0,1fr)_minmax(0,1fr)_44px] items-center gap-2 text-[10px] font-medium uppercase text-[#010a04]/70 sm:gap-[9px] sm:text-xs">
          <span>{t("settings.adminClubsCourtName")}</span>
          <span>{t("settings.adminClubsCourtType")}</span>
          <span>{t("settings.adminClubsCourtPlacement")}</span>
          <span />
        </div>
        {courts.map((court, index) => (
          <div
            key={index}
            className="grid grid-cols-[minmax(0,128px)_minmax(0,1fr)_minmax(0,1fr)_44px] items-center gap-2 sm:gap-[9px]"
          >
            <Input
              placeholder={t("settings.adminClubsCourtName")}
              value={court.name}
              onChange={(event) => onCourtChange(index, "name", event.target.value)}
              className={courtInputClassName}
            />
            <Select value={court.type} onValueChange={(value) => onCourtChange(index, "type", value)}>
              <SelectTrigger className={courtSelectClassName}>
                <SelectValue placeholder={t("selectOption")} />
              </SelectTrigger>
              <SelectContent>
                {courtTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`settings.adminClubsCourtType${type.charAt(0).toUpperCase()}${type.slice(1)}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={court.placement}
              onValueChange={(value) => onCourtChange(index, "placement", value)}
            >
              <SelectTrigger className={courtSelectClassName}>
                <SelectValue placeholder={t("selectOption")} />
              </SelectTrigger>
              <SelectContent>
                {courtPlacements.map((placement) => (
                  <SelectItem key={placement} value={placement}>
                    {t(
                      `settings.adminClubsCourtPlacement${placement.charAt(0).toUpperCase()}${placement.slice(1)}`
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              className="min-h-9 min-w-9 shrink-0 rounded-none p-0 text-[#010a04]/50 hover:bg-transparent hover:text-[#010a04] focus-visible:ring-offset-0 sm:min-h-[44px] sm:min-w-[44px]"
              onClick={() => onRemoveCourt(index)}
              aria-label={t("settings.adminClubsDeleteCourtAria")}
            >
              <Delete01Icon size={12} className="sm:size-[14px]" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onAddCourt}
        className="h-7 w-full rounded-[8px] border-dashed border-brand-accent/55 bg-brand-accent/15 text-[11px] font-medium text-[#a4790d] shadow-none hover:bg-brand-accent/20 sm:h-[30px] sm:text-xs"
      >
        {t("settings.adminClubsAddCourt")}
      </Button>
    </div>
  );
}
