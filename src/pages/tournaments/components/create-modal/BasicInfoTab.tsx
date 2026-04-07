import { useTranslation } from "react-i18next";
import { format, startOfDay } from "date-fns";
import { Calendar as CalendarIcon } from "@/icons/figma-icons";
import { cn } from "@/lib/utils";
import { parseIsoDateSafely } from "@/utils/date";
import { TOURNAMENT_MODES } from "@/constants/tournament";
import { getScheduledTimeRangeErrorKey } from "@/lib/tournament/form";
import type {
  CreateTournamentInput,
  TournamentClub,
  TournamentMode,
} from "@/models/tournament/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { TimePicker } from "@/components/ui/time-picker";
import { Textarea } from "@/components/ui/textarea";
interface BasicInfoTabProps {
  form: CreateTournamentInput;
  clubs: TournamentClub[];
  update: (updates: Partial<CreateTournamentInput>) => void;
  /** When false (default), the date picker cannot select days before today. */
  allowPastDates?: boolean;
}

export function BasicInfoTab({
  form,
  clubs,
  update,
  allowPastDates = false,
}: BasicInfoTabProps) {
  const { t } = useTranslation();

  const selectedDate = parseIsoDateSafely(form.date) ?? undefined;
  const scheduledErrorKey = getScheduledTimeRangeErrorKey(form);

  return (
    <div className="min-w-0 max-w-full space-y-3 overflow-x-clip sm:space-y-5">
      <div className="min-w-0 space-y-2 sm:space-y-[10px]">
        <Label
          htmlFor="create-tournament-basic-name"
          className="text-[13px] font-medium text-[#010a04] sm:text-[15px]"
        >
          {t("tournaments.tournamentName")} *
        </Label>
        <Input
          id="create-tournament-basic-name"
          required
          aria-required="true"
          placeholder={t("tournaments.enterName")}
          value={form.name}
          onChange={(e) => update({ name: e.target.value })}
          className="h-[38px] rounded-[10px] border-[#e1e3e8] bg-[#f9fafc] px-3 text-[13px] text-[#010a04] placeholder:text-[#010a04]/50 sm:h-[46px] sm:rounded-[12px] sm:px-[15px] sm:text-[14px]"
        />
      </div>

      <div className="space-y-2 sm:space-y-3">
        <Label
          id="create-tournament-basic-mode-label"
          className="text-[13px] font-medium text-[#010a04] sm:text-[15px]"
        >
          {t("tournaments.tournamentType")} *
        </Label>
        <Select
          required
          value={form.tournamentMode}
          onValueChange={(mode: TournamentMode) => {
            if(!TOURNAMENT_MODES.includes(mode)) return;
            update(
              mode === "period"
                ? {
                    tournamentMode: mode,
                    date: null,
                    startTime: null,
                    endTime: null,
                  }
                : { tournamentMode: mode },
            );
          }}
        >
          <SelectTrigger
            id="create-tournament-basic-mode"
            aria-labelledby="create-tournament-basic-mode-label"
            className="h-[38px] w-full rounded-[10px] border-[#e1e3e8] bg-[#f9fafc] px-3 text-[14px] font-medium text-[#010a04] sm:h-[46px] sm:rounded-[12px] sm:px-[15px] sm:text-[16px]"
          >
            <SelectValue placeholder={t("selectOption")} />
          </SelectTrigger>
          <SelectContent>
            {TOURNAMENT_MODES.map((mode) => (
              <SelectItem key={mode} value={mode}>
                {t(`tournaments.tournamentMode.${mode}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-0 space-y-2 sm:space-y-3">
        <Label
          id="create-tournament-basic-club-label"
          className="text-[13px] font-medium text-[#010a04] sm:text-[15px]"
        >
          {t("tournaments.selectClub")}
        </Label>
        <p
          id="create-tournament-basic-club-hint"
          className="break-words text-[12px] leading-[1.35] text-[#010a04]/60 [overflow-wrap:anywhere] sm:text-[14px] sm:leading-[1.4]"
        >
          {t("tournaments.selectClubHint")}
        </p>
        <Select
          value={form.club}
          onValueChange={(v) => update({ club: v, sponsor: null })}
        >
          <SelectTrigger
            id="create-tournament-basic-club"
            aria-labelledby="create-tournament-basic-club-label"
            aria-describedby="create-tournament-basic-club-hint"
            className="h-[38px] w-full rounded-[10px] border-[#e1e3e8] bg-[#f9fafc] px-3 text-[14px] font-medium text-[#010a04] sm:h-[46px] sm:rounded-[12px] sm:px-[15px] sm:text-[16px]"
          >
            <SelectValue placeholder={t("tournaments.chooseClub")} />
          </SelectTrigger>
          <SelectContent>
            {clubs.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {form.tournamentMode === "singleDay" && (
        <>
          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-[14px]">
            <div className="min-w-0">
              <Label
                id="create-tournament-basic-date-label"
                className="text-[13px] font-medium text-[#010a04] sm:text-[15px]"
              >
                {t("tournaments.date")} *
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="create-tournament-basic-date"
                    type="button"
                    aria-labelledby="create-tournament-basic-date-label"
                    variant="outline"
                    className={cn(
                      "mt-2 h-[38px] w-full min-w-0 max-w-full justify-between overflow-hidden rounded-[10px] border-[#e1e3e8] bg-[#f9fafc] px-3 text-left text-[13px] font-normal text-[#010a04] sm:mt-[10px] sm:h-[46px] sm:rounded-[12px] sm:px-[15px] sm:text-[14px]",
                      !selectedDate && "text-[#010a04]/50",
                    )}
                  >
                    <span className="min-w-0 truncate">
                      {selectedDate
                        ? format(selectedDate, "dd/MM/yyyy")
                        : t("tournaments.datePlaceholder")}
                    </span>
                    <CalendarIcon className="h-4 w-4 shrink-0 text-[#010a04]/65 sm:h-5 sm:w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (!date) return;
                      update({ date: format(date, "yyyy-MM-dd") });
                    }}
                    disabled={
                      allowPastDates
                        ? undefined
                        : (date) => startOfDay(date) < startOfDay(new Date())
                    }
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="min-w-0">
              <Label
                id="create-tournament-basic-start-label"
                className="text-[13px] font-medium text-[#010a04] sm:text-[15px]"
              >
                {t("tournaments.startTime")} *
              </Label>
              <div className="mt-2 sm:mt-[10px]">
                <TimePicker
                  id="create-tournament-basic-start"
                  aria-labelledby="create-tournament-basic-start-label"
                  value={form.startTime ?? null}
                  onChange={(time) => update({ startTime: time })}
                  maxTime={form.endTime ?? undefined}
                  maxExclusive={
                    form.endTime != null && form.startTime !== form.endTime
                  }
                />
              </div>
            </div>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-[14px]">
            <div className="min-w-0">
              <Label
                id="create-tournament-basic-end-label"
                className="text-[13px] font-medium text-[#010a04] sm:text-[15px]"
              >
                {t("tournaments.endTime")} *
              </Label>
              <div className="mt-2 sm:mt-[10px]">
                <TimePicker
                  id="create-tournament-basic-end"
                  aria-labelledby="create-tournament-basic-end-label"
                  value={form.endTime ?? null}
                  onChange={(time) => update({ endTime: time })}
                  minTime={form.startTime ?? undefined}
                  minExclusive={
                    form.startTime != null && form.startTime !== form.endTime
                  }
                  popoverAlign="end"
                />
              </div>
            </div>

            <div aria-hidden="true" className="hidden sm:block" />
          </div>

          {scheduledErrorKey ? (
            <p
              className="text-[13px] font-medium leading-snug text-destructive sm:text-sm"
              role="alert"
            >
              {t(scheduledErrorKey)}
            </p>
          ) : null}
        </>
      )}

      <div className="min-w-0 space-y-2 sm:space-y-[10px]">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0">
          <Label
            htmlFor="create-tournament-basic-description"
            className="text-[13px] font-medium text-[#010a04] sm:text-[15px]"
          >
            {t("tournaments.description")}
          </Label>
          <span
            className="text-[11px] font-normal tabular-nums text-[#010a04]/40 sm:text-[12px] sm:text-[#010a04]/38"
            aria-live="polite"
          >
            {(form.descriptionInfo ?? "").length}/500
          </span>
        </div>
        <Textarea
          id="create-tournament-basic-description"
          placeholder={t("tournaments.descriptionPlaceholder")}
          maxLength={500}
          value={form.descriptionInfo ?? ""}
          onChange={(e) => update({ descriptionInfo: e.target.value })}
          className="h-[74px] w-full rounded-[10px] border border-[#e1e3e8] bg-[#f9fafc] px-3 py-3 text-[13px] text-[#010a04] placeholder:text-[#010a04]/50 sm:h-[110px] sm:rounded-[12px] sm:px-[15px] sm:py-[15px] sm:text-[14px]"
        />
      </div>
    </div>
  );
}
