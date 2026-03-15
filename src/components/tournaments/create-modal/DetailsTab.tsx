import { useTranslation } from "react-i18next";
import type { CreateTournamentInput } from "@/hooks/tournament";
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

const PLAY_MODES = [
  { value: "TieBreak10", labelKey: "tournaments.playModes.tieBreak10" },
  { value: "1set", labelKey: "tournaments.playModes.oneSet" },
  { value: "3setTieBreak10", labelKey: "tournaments.playModes.threeSetTieBreak10" },
  { value: "3set", labelKey: "tournaments.playModes.threeSet" },
  { value: "5set", labelKey: "tournaments.playModes.fiveSet" },
] as const;

const DURATION_OPTIONS = [
  { value: "15 Min", labelKey: "tournaments.duration.min15" },
  { value: "30 Min", labelKey: "tournaments.duration.min30" },
  { value: "45 Min", labelKey: "tournaments.duration.min45" },
  { value: "60 Min", labelKey: "tournaments.duration.min60" },
  { value: "90 Min", labelKey: "tournaments.duration.min90" },
] as const;

const BREAK_OPTIONS = [
  { value: "0 Minutes", labelKey: "tournaments.break.min0" },
  { value: "5 Minutes", labelKey: "tournaments.break.min5" },
  { value: "10 Minutes", labelKey: "tournaments.break.min10" },
  { value: "15 Minutes", labelKey: "tournaments.break.min15" },
] as const;

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
          <Select value={form.playMode} onValueChange={(v) => update({ playMode: v })}>
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
              value={form.externalFee ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                const n = v === "" ? undefined : parseFloat(v);
                update({ externalFee: Number.isFinite(n) ? n : undefined });
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
            <Select value={form.playTime ?? "30 Min"} onValueChange={(v) => update({ playTime: v })}>
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
            <Select value={form.pauseTime ?? "5 Minutes"} onValueChange={(v) => update({ pauseTime: v })}>
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
              value={form.minMember ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                const n = v === "" ? undefined : parseFloat(v);
                update({ minMember: Number.isFinite(n) ? n : undefined });
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
              value={form.maxMember ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                const n = v === "" ? undefined : parseFloat(v);
                update({ maxMember: Number.isFinite(n) ? n : undefined });
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
