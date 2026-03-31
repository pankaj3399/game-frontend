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

  return (
    <div className="space-y-[10px] rounded-[12px]">
      <Label className="text-base font-medium text-[#010a04]">
        {t("settings.adminClubsAllCourts")}
      </Label>
      <div className="space-y-[9px]">
        <div className="grid grid-cols-[minmax(0,128px)_minmax(0,1fr)_minmax(0,1fr)_44px] items-center gap-[9px] text-xs font-medium uppercase text-[#010a04]/70">
          <span>{t("settings.adminClubsCourtName")}</span>
          <span>{t("settings.adminClubsCourtType")}</span>
          <span>{t("settings.adminClubsCourtPlacement")}</span>
          <span />
        </div>
        {courts.map((court, index) => (
          <div
            key={index}
            className="grid grid-cols-[minmax(0,128px)_minmax(0,1fr)_minmax(0,1fr)_44px] items-center gap-[9px]"
          >
            <Input
              placeholder={t("settings.adminClubsCourtName")}
              value={court.name}
              onChange={(event) => onCourtChange(index, "name", event.target.value)}
              className="h-[38px] rounded-[8px] border-[#e1e3e8] bg-[#f9fafc] px-3 text-sm shadow-none placeholder:text-[#010a04]/50 focus-visible:ring-0"
            />
            <Select value={court.type} onValueChange={(value) => onCourtChange(index, "type", value)}>
              <SelectTrigger className="h-[38px] w-full rounded-[8px] border-[#e1e3e8] bg-[#f9fafc] px-2 text-[13px] font-medium text-[#010a04] shadow-none focus-visible:ring-0 [&_svg]:size-3.5">
                <SelectValue />
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
              <SelectTrigger className="h-[38px] w-full rounded-[8px] border-[#e1e3e8] bg-[#f9fafc] px-2 text-[13px] font-medium text-[#010a04] shadow-none focus-visible:ring-0 [&_svg]:size-3.5">
                <SelectValue />
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
              className="min-h-[44px] min-w-[44px] shrink-0 rounded-none p-0 text-[#010a04]/50 hover:bg-transparent hover:text-[#010a04] focus-visible:ring-offset-0"
              onClick={() => onRemoveCourt(index)}
              aria-label={t("settings.adminClubsDeleteCourtAria")}
            >
              <Delete01Icon size={14} />
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onAddCourt}
        className="h-[30px] w-full rounded-[8px] border-dashed border-[#f4c95d]/55 bg-[#f4c95d]/15 text-xs font-medium text-[#a4790d] shadow-none hover:bg-[#f4c95d]/20"
      >
        {t("settings.adminClubsAddCourt")}
      </Button>
    </div>
  );
}
