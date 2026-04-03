import { useTranslation } from "react-i18next";
import { format, parseISO } from "date-fns";
import { Calendar as CalendarIcon } from "@/icons/figma-icons";
import { cn } from "@/lib/utils";
import { TOURNAMENT_MODES } from "@/constants/tournament";
import type { CreateTournamentInput, TournamentClub, TournamentMode } from "@/models/tournament/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
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

interface BasicInfoTabProps {
  form: CreateTournamentInput;
  clubs: TournamentClub[];
  update: (updates: Partial<CreateTournamentInput>) => void;
}

export function BasicInfoTab({ form, clubs, update }: BasicInfoTabProps) {
  const { t } = useTranslation();

  const selectedDate = form.date ? parseISO(form.date) : undefined;

  return (
    <TabsContent value="basic" className="mt-0">
      <div className="space-y-3 sm:space-y-5">
        <div className="space-y-2 sm:space-y-[10px]">
          <Label
            htmlFor="create-tournament-basic-name"
            className="text-[13px] font-medium text-[#010a04] sm:text-[15px]"
          >
            {t("tournaments.tournamentName")} *
          </Label>
          <Input
            id="create-tournament-basic-name"
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
            value={form.tournamentMode}
            onValueChange={(v: TournamentMode) => {
              const mode = v;
              update(mode === "period" ? { tournamentMode: mode, date: null, startTime: null, endTime: null } : { tournamentMode: mode });

            }}
          >
            <SelectTrigger
              id="create-tournament-basic-mode"
              aria-labelledby="create-tournament-basic-mode-label"
              className="h-[38px] w-full rounded-[10px] border-[#e1e3e8] bg-[#f9fafc] px-3 text-[14px] font-medium text-[#010a04] sm:h-[46px] sm:rounded-[12px] sm:px-[15px] sm:text-[16px]"
            >
              <SelectValue />
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

        <div className="space-y-2 sm:space-y-3">
          <Label
            id="create-tournament-basic-club-label"
            className="text-[13px] font-medium text-[#010a04] sm:text-[15px]"
          >
            {t("tournaments.selectClub")}
          </Label>
          <p
            id="create-tournament-basic-club-hint"
            className="text-[12px] leading-[1.35] text-[#010a04]/60 sm:text-[14px] sm:leading-[1.4]"
          >
            {t("tournaments.selectClubHint")}
          </p>
          <Select value={form.club} onValueChange={(v) => update({ club: v, sponsor: null })}>
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-[14px]">
              <div>
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
                        "mt-2 h-[38px] w-full justify-between rounded-[10px] border-[#e1e3e8] bg-[#f9fafc] px-3 text-left text-[13px] font-normal text-[#010a04] sm:mt-[10px] sm:h-[46px] sm:rounded-[12px] sm:px-[15px] sm:text-[14px]",
                        !selectedDate && "text-[#010a04]/50"
                      )}
                    >
                      <span>
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
                      onSelect={(date) => update({ date: date ? format(date, "yyyy-MM-dd") : null })}
                      autoFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
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
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-[14px]">
              <div>
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
                  />
                </div>
              </div>

              <div aria-hidden="true" className="hidden sm:block" />
            </div>

          </>
        )}

        <div className="space-y-2 sm:space-y-[10px]">
          <Label
            htmlFor="create-tournament-basic-description"
            className="text-[13px] font-medium text-[#010a04] sm:text-[15px]"
          >
            {t("tournaments.description")}
          </Label>
          <textarea
            id="create-tournament-basic-description"
            placeholder={t("tournaments.descriptionPlaceholder")}
            value={form.descriptionInfo ?? ""}
            onChange={(e) => update({ descriptionInfo: e.target.value })}
            className="h-[74px] w-full rounded-[10px] border border-[#e1e3e8] bg-[#f9fafc] px-3 py-3 text-[13px] text-[#010a04] placeholder:text-[#010a04]/50 sm:h-[110px] sm:rounded-[12px] sm:px-[15px] sm:py-[15px] sm:text-[14px]"
          />
        </div>
      </div>
    </TabsContent>
  );
}
