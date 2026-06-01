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
    "h-9 rounded-[8px] border-[#dfe3e8] bg-[#fafbfc] px-3 text-sm shadow-none placeholder:text-[#010a04]/42 focus-visible:border-[#9fc9ae] focus-visible:ring-2 focus-visible:ring-[#067429]/10";
  const courtSelectClassName =
    "h-9 w-full rounded-[8px] border-[#dfe3e8] bg-[#fafbfc] px-2 text-sm font-medium text-[#010a04] shadow-none focus-visible:border-[#9fc9ae] focus-visible:ring-2 focus-visible:ring-[#067429]/10 [&_svg]:size-3.5";

  return (
    <div className="space-y-2 rounded-[12px] border border-[#e7eaee] bg-[#fbfcfd] p-3">
      <Label className="text-sm font-semibold text-[#010a04]">
        {t("settings.adminClubsAllCourts")}
      </Label>
      <div className="space-y-2">
        <div className="grid grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,1fr)_32px] items-center gap-2 text-[11px] font-semibold uppercase text-[#010a04]/62">
          <span>{t("settings.adminClubsCourtName")}</span>
          <span>{t("settings.adminClubsCourtType")}</span>
          <span>{t("settings.adminClubsCourtPlacement")}</span>
          <span />
        </div>
        {courts.map((court, index) => (
          <div
            key={index}
            className="grid grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,1fr)_32px] items-center gap-2"
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
              className="size-8 min-h-8 min-w-8 shrink-0 rounded-[7px] p-0 text-[#010a04]/45 hover:bg-[#fff5f5] hover:text-[#b42318] focus-visible:ring-offset-0"
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
        className="h-8 w-full rounded-[8px] border-dashed border-brand-accent/55 bg-brand-accent/12 text-xs font-medium text-[#a4790d] shadow-none hover:bg-brand-accent/20"
      >
        {t("settings.adminClubsAddCourt")}
      </Button>
    </div>
  );
}
