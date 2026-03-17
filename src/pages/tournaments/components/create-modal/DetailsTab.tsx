import { useTranslation } from "react-i18next";
import type { CreateTournamentInput, TournamentPlayMode } from "@/models/tournament/types";
import { BREAK_OPTIONS, DURATION_OPTIONS, PLAY_MODES } from "@/constants/tournament";
import { TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DetailsTabProps {
  form: CreateTournamentInput;
  update: (updates: Partial<CreateTournamentInput>) => void;
}

export function DetailsTab({ form, update }: DetailsTabProps) {
  const { t } = useTranslation();

  return (
    <TabsContent value="details" className="mt-0">
      <div className="space-y-4">
        <div>
          <Label className="text-[14px] font-medium text-[#111827]">
            {t("tournaments.gameMode")} *
          </Label>
          <Select value={form.playMode} onValueChange={(v: TournamentPlayMode) => update({ playMode: v })}>
            <SelectTrigger className="mt-1 h-10 w-full rounded-lg border-[#e5e7eb] text-[14px] font-normal">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PLAY_MODES.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {t(m.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-[14px] font-medium text-[#111827]">
            {t("tournaments.entryFee")}
          </Label>
          <div className="mt-1 flex h-10 items-center gap-2 rounded-lg border border-[#e5e7eb] px-3">
            <span className="text-[14px] text-[#9ca3af]">$</span>
            <Input
              type="number"
              min={0}
              placeholder="00"
              value={form.entryFee}
              onChange={(e) => {
                const v = e.target.value;
                const n = v === "" ? 0 : parseFloat(v);
                update({ entryFee: Number.isFinite(n) ? n : 0 });
              }}
              className="h-auto border-0 p-0 text-[14px] shadow-none focus-visible:ring-0"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-[14px] font-medium text-[#111827]">
              {t("tournaments.matchDuration")}
            </Label>
            <Select value={form.duration} onValueChange={(v) => update({ duration: v })}>
              <SelectTrigger className="mt-1 h-10 w-full rounded-lg border-[#e5e7eb] text-[14px] font-normal">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {t(d.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-[14px] font-medium text-[#111827]">
              {t("tournaments.breakTime")}
            </Label>
            <Select value={form.breakDuration} onValueChange={(v) => update({ breakDuration: v })}>
              <SelectTrigger className="mt-1 h-10 w-full rounded-lg border-[#e5e7eb] text-[14px] font-normal">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BREAK_OPTIONS.map((b) => (
                  <SelectItem key={b.value} value={b.value}>
                    {t(b.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-[14px] font-medium text-[#111827]">
              {t("tournaments.minPlayers")}
            </Label>
            <Input
              type="number"
              min={1}
              value={form.minMember}
              onChange={(e) => {
                const v = e.target.value;
                const n = v === "" ? 1 : parseFloat(v);
                update({ minMember: Number.isFinite(n) ? n : 1 });
              }}
              className="mt-1 h-10 rounded-lg border-[#e5e7eb] text-[14px]"
            />
          </div>

          <div>
            <Label className="text-[14px] font-medium text-[#111827]">
              {t("tournaments.maxPlayers")}
            </Label>
            <Input
              type="number"
              min={1}
              value={form.maxMember}
              onChange={(e) => {
                const v = e.target.value;
                const n = v === "" ? 1 : parseFloat(v);
                update({ maxMember: Number.isFinite(n) ? n : 1 });
              }}
              className="mt-1 h-10 rounded-lg border-[#e5e7eb] text-[14px]"
            />
          </div>
        </div>

        <div>
          <Label className="text-[14px] font-medium text-[#111827]">
            {t("tournaments.foodDrinks")}
          </Label>
          <textarea
            placeholder={t("tournaments.foodDrinksPlaceholder")}
            value={form.foodInfo ?? ""}
            onChange={(e) => update({ foodInfo: e.target.value })}
            className="mt-1 min-h-[106px] w-full rounded-lg border border-[#e5e7eb] bg-[#f3f4f6] px-3 py-2 text-[14px] placeholder:text-[#9ca3af]"
          />
        </div>
      </div>
    </TabsContent>
  );
}
