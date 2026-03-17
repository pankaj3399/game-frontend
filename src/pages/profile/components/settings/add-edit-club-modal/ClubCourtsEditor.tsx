import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete01Icon } from "@hugeicons/core-free-icons";
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
    <div className="space-y-3">
      <Label className="text-xs font-medium uppercase text-muted-foreground">
        {t("settings.adminClubsAllCourts")} <span className="text-muted-foreground/70">(optional)</span>
      </Label>
      <div className="rounded-lg border border-[#e5e7eb] overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 p-2 bg-[#f9fafb] text-xs font-medium uppercase text-muted-foreground">
          <span>{t("settings.adminClubsCourtName")}</span>
          <span className="w-24">{t("settings.adminClubsCourtType")}</span>
          <span className="w-24">{t("settings.adminClubsCourtPlacement")}</span>
          <span className="w-8" />
        </div>
        {courts.map((court, index) => (
          <div
            key={index}
            className="grid grid-cols-[1fr_auto_auto_auto] gap-2 p-2 items-center border-t border-[#e5e7eb]"
          >
            <Input
              placeholder={t("settings.adminClubsCourtName")}
              value={court.name}
              onChange={(event) => onCourtChange(index, "name", event.target.value)}
              className="h-9 text-sm"
            />
            <Select value={court.type} onValueChange={(value) => onCourtChange(index, "type", value)}>
              <SelectTrigger className="h-9 w-24">
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
              <SelectTrigger className="h-9 w-24">
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
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-destructive"
              onClick={() => onRemoveCourt(index)}
              aria-label={t("settings.adminClubsDeleteCourtAria")}
            >
              <HugeiconsIcon icon={Delete01Icon} size={16} />
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onAddCourt} className="w-full">
        {t("settings.adminClubsAddCourt")}
      </Button>
    </div>
  );
}
