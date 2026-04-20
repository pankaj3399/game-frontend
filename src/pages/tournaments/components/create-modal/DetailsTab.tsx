import { useId } from "react";
import { useTranslation } from "react-i18next";
import type {
  CreateTournamentInput,
  TournamentPlayMode,
} from "@/models/tournament/types";
import {
  BREAK_OPTIONS,
  DURATION_OPTIONS,
  PLAY_MODES,
} from "@/constants/tournament";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TournamentMemberCountInput } from "@/pages/tournaments/components/create-modal/TournamentMemberCountInput";

interface DetailsTabProps {
  form: CreateTournamentInput;
  update: (updates: Partial<CreateTournamentInput>) => void;
  formScopeKey: string;
}

export function DetailsTab({ form, update, formScopeKey }: DetailsTabProps) {
  const { t } = useTranslation();
  const uid = useId();
  const playModeLabelId = `${uid}-play-mode-label`;
  const playModeTriggerId = `${uid}-play-mode-trigger`;
  const durationLabelId = `${uid}-duration-label`;
  const durationTriggerId = `${uid}-duration-trigger`;
  const breakLabelId = `${uid}-break-label`;
  const breakTriggerId = `${uid}-break-trigger`;
  const entryFeeId = `${uid}-entry-fee`;
  const minPlayersId = `${uid}-min-players`;
  const maxPlayersId = `${uid}-max-players`;
  const foodDrinksId = `${uid}-food-drinks`;
  const foodDrinksCounterId = `${foodDrinksId}-counter`;

  return (
    <div className="min-w-0 max-w-full space-y-4 overflow-x-clip sm:space-y-5">
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-[14px]">
        <div className="space-y-2 sm:space-y-[10px]">
          <Label
            id={playModeLabelId}
            htmlFor={playModeTriggerId}
            className="text-[13px] font-medium text-[#010a04] sm:text-[15px]"
          >
            {t("tournaments.gameMode")} *
          </Label>
          <Select
            required
            value={form.playMode}
            onValueChange={(v: TournamentPlayMode) => update({ playMode: v })}
          >
            <SelectTrigger
              id={playModeTriggerId}
              aria-labelledby={playModeLabelId}
              aria-required="true"
              className="h-[38px] w-full rounded-[10px] border-[#e1e3e8] bg-[#f9fafc] px-3 text-[14px] font-medium text-[#010a04] sm:h-[46px] sm:rounded-[12px] sm:px-[15px] sm:text-[16px]"
            >
              <SelectValue placeholder={t("selectOption")} />
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

        <div className="space-y-2 sm:space-y-[10px]">
          <Label
            id={durationLabelId}
            htmlFor={durationTriggerId}
            className="text-[13px] font-medium text-[#010a04] sm:text-[15px]"
          >
            {t("tournaments.matchDuration")}
          </Label>
          <Select
            value={String(form.duration)}
            onValueChange={(v) => {
              update({ duration: Number.parseInt(v, 10) });
            }}
          >
            <SelectTrigger
              id={durationTriggerId}
              aria-labelledby={durationLabelId}
              className="h-[38px] w-full rounded-[10px] border-[#e1e3e8] bg-[#f9fafc] px-3 text-[14px] font-medium text-[#010a04] sm:h-[46px] sm:rounded-[12px] sm:px-[15px] sm:text-[16px]"
            >
              <SelectValue placeholder={t("selectOption")} />
            </SelectTrigger>
            <SelectContent>
              {DURATION_OPTIONS.map((d) => (
                <SelectItem key={d.value} value={String(d.value)}>
                  {t(d.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-[14px]">
        <div className="space-y-2 sm:space-y-[10px]">
          <Label
            id={breakLabelId}
            htmlFor={breakTriggerId}
            className="text-[13px] font-medium text-[#010a04] sm:text-[15px]"
          >
            {t("tournaments.breakTime")}
          </Label>
          <Select
            value={String(form.breakDuration)}
            onValueChange={(v) => {
              update({ breakDuration: Number.parseInt(v, 10) });
            }}
          >
            <SelectTrigger
              id={breakTriggerId}
              aria-labelledby={breakLabelId}
              className="h-[38px] w-full rounded-[10px] border-[#e1e3e8] bg-[#f9fafc] px-3 text-[14px] font-medium text-[#010a04] sm:h-[46px] sm:rounded-[12px] sm:px-[15px] sm:text-[16px]"
            >
              <SelectValue placeholder={t("selectOption")} />
            </SelectTrigger>
            <SelectContent>
              {BREAK_OPTIONS.map((b) => (
                <SelectItem key={b.value} value={String(b.value)}>
                  {t(b.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="hidden sm:block" aria-hidden="true" />
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-[14px]">
        <div className="space-y-2 sm:space-y-[10px]">
          <Label
            htmlFor={entryFeeId}
            className="text-[13px] font-medium text-[#010a04] sm:text-[15px]"
          >
            {t("tournaments.entryFee")}
          </Label>
          <div className="flex h-[38px] items-center gap-2 rounded-[10px] border border-[#e1e3e8] bg-[#f9fafc] px-3 sm:h-[46px] sm:rounded-[12px] sm:px-[15px]">
            <span className="text-[16px] leading-none text-[#010a04]/40 sm:text-[22px]">
              $
            </span>
            <Input
              id={entryFeeId}
              type="number"
              min={0}
              step="0.01"
              placeholder="00"
              value={form.entryFee}
              onChange={(e) => {
                const v = e.target.value;
                const n = v === "" ? 0 : Number(v);
                update({ entryFee: Number.isFinite(n) ? n : 0 });
              }}
              className="h-auto border-0 bg-transparent p-0 text-[13px] font-normal text-[#010a04] shadow-none focus-visible:ring-0 sm:text-[16px]"
            />
          </div>
        </div>

        <div className="space-y-2 sm:space-y-[10px]">
          <Label
            htmlFor={minPlayersId}
            className="text-[13px] font-medium text-[#010a04] sm:text-[15px]"
          >
            {t("tournaments.minPlayers")}
          </Label>
          <TournamentMemberCountInput
            key={`${formScopeKey}-min-${form.minMember}`}
            id={minPlayersId}
            value={form.minMember}
            peerValue={form.maxMember}
            role="min"
            onCommitPair={(next) => update(next)}
            className="h-[38px] rounded-[10px] border-[#e1e3e8] bg-[#f9fafc] px-3 text-[13px] font-normal text-[#010a04] sm:h-[46px] sm:rounded-[12px] sm:px-[15px] sm:text-[16px]"
          />
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-[14px]">
        <div className="space-y-2 sm:space-y-[10px]">
          <Label
            htmlFor={maxPlayersId}
            className="text-[13px] font-medium text-[#010a04] sm:text-[15px]"
          >
            {t("tournaments.maxPlayers")}
          </Label>
          <TournamentMemberCountInput
            key={`${formScopeKey}-max-${form.maxMember}`}
            id={maxPlayersId}
            value={form.maxMember}
            peerValue={form.minMember}
            role="max"
            onCommitPair={(next) => update(next)}
            className="h-[38px] rounded-[10px] border-[#e1e3e8] bg-[#f9fafc] px-3 text-[13px] font-normal text-[#010a04] sm:h-[46px] sm:rounded-[12px] sm:px-[15px] sm:text-[16px]"
          />
        </div>

        <div className="hidden sm:block" aria-hidden="true" />
      </div>

      <div className="min-w-0 space-y-2 sm:space-y-[10px]">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0">
          <Label
            htmlFor={foodDrinksId}
            className="text-[13px] font-medium text-[#010a04] sm:text-[15px]"
          >
            {t("tournaments.foodDrinks")}
          </Label>
          <span
            id={foodDrinksCounterId}
            className="text-[11px] font-normal tabular-nums text-[#010a04]/40 sm:text-[12px] sm:text-[#010a04]/38"
            aria-live="polite"
          >
            {(form.foodInfo ?? "").length}/500
          </span>
        </div>
        <Textarea
          id={foodDrinksId}
          aria-describedby={foodDrinksCounterId}
          placeholder={t("tournaments.foodDrinksPlaceholder")}
          maxLength={500}
          value={form.foodInfo ?? ""}
          onChange={(e) => update({ foodInfo: e.target.value })}
          className="h-[74px] w-full rounded-[10px] border border-[#e1e3e8] bg-[#f9fafc] px-3 py-3 text-[13px] text-[#010a04] placeholder:text-[#010a04]/50 sm:h-[110px] sm:rounded-[12px] sm:px-[15px] sm:py-[15px] sm:text-[14px]"
        />
      </div>
    </div>
  );
}
