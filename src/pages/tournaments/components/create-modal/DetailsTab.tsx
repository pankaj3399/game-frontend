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
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
          <div className="space-y-[10px]">
            <Label className="text-[15px] font-medium text-[#010a04]">
              {t("tournaments.gameMode")} *
            </Label>
            <Select value={form.playMode} onValueChange={(v: TournamentPlayMode) => update({ playMode: v })}>
              <SelectTrigger className="h-[46px] w-full rounded-[12px] border-[#e1e3e8] bg-[#f9fafc] px-[15px] text-[16px] font-medium text-[#010a04]">
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

          <div className="space-y-[10px]">
            <Label className="text-[15px] font-medium text-[#010a04]">
              {t("tournaments.matchDuration")}
            </Label>
            <Select value={form.duration} onValueChange={(v) => update({ duration: v })}>
              <SelectTrigger className="h-[46px] w-full rounded-[12px] border-[#e1e3e8] bg-[#f9fafc] px-[15px] text-[16px] font-medium text-[#010a04]">
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
        </div>

        <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
          <div className="space-y-[10px]">
            <Label className="text-[15px] font-medium text-[#010a04]">
              {t("tournaments.breakTime")}
            </Label>
            <Select value={form.breakDuration} onValueChange={(v) => update({ breakDuration: v })}>
              <SelectTrigger className="h-[46px] w-full rounded-[12px] border-[#e1e3e8] bg-[#f9fafc] px-[15px] text-[16px] font-medium text-[#010a04]">
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

          <div aria-hidden="true" />
        </div>

        <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
          <div className="space-y-[10px]">
            <Label className="text-[15px] font-medium text-[#010a04]">
              {t("tournaments.entryFee")}
            </Label>
            <div className="flex h-[46px] items-center gap-2 rounded-[12px] border border-[#e1e3e8] bg-[#f9fafc] px-[15px]">
              <span className="text-[22px] leading-none text-[#010a04]/40">$</span>
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
                className="h-auto border-0 bg-transparent p-0 text-[16px] font-normal text-[#010a04] shadow-none focus-visible:ring-0"
              />
            </div>
          </div>

          <div className="space-y-[10px]">
            <Label className="text-[15px] font-medium text-[#010a04]">
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
              className="h-[46px] rounded-[12px] border-[#e1e3e8] bg-[#f9fafc] px-[15px] text-[16px] font-normal text-[#010a04]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
          <div className="space-y-[10px]">
            <Label className="text-[15px] font-medium text-[#010a04]">
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
              className="h-[46px] rounded-[12px] border-[#e1e3e8] bg-[#f9fafc] px-[15px] text-[16px] font-normal text-[#010a04]"
            />
          </div>

          <div aria-hidden="true" />
        </div>

        <div className="space-y-[10px]">
          <Label className="text-[15px] font-medium text-[#010a04]">
            {t("tournaments.foodDrinks")}
          </Label>
          <textarea
            placeholder={t("tournaments.foodDrinksPlaceholder")}
            value={form.foodInfo ?? ""}
            onChange={(e) => update({ foodInfo: e.target.value })}
            className="min-h-[106px] w-full rounded-[12px] border border-[#e1e3e8] bg-[#f9fafc] px-[15px] py-[15px] text-[16px] font-normal text-[#010a04] placeholder:text-[#010a04]/50"
          />
        </div>
      </div>
    </TabsContent>
  );
}
