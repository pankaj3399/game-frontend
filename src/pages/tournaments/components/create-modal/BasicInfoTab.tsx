import { useTranslation } from "react-i18next";
import { format, parseISO } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
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
      <div className="space-y-5">
        <div className="space-y-[10px]">
          <Label className="text-[15px] font-medium text-[#010a04]">
            {t("tournaments.tournamentName")} *
          </Label>
          <Input
            placeholder={t("tournaments.enterName")}
            value={form.name}
            onChange={(e) => update({ name: e.target.value })}
            className="h-[42px] rounded-[12px] border-[#e1e3e8] bg-[#f9fafc] px-[15px] text-[14px] text-[#010a04] placeholder:text-[#010a04]/50 sm:h-[46px]"
          />
        </div>

        <div className="space-y-3">
          <Label className="text-[15px] font-medium text-[#010a04]">
            {t("tournaments.tournamentType")} *
          </Label>
          <Select
            value={form.tournamentMode}
            onValueChange={(v: TournamentMode) => {
              const mode = v;
              update(mode === "period" ? { tournamentMode: mode, date: null, startTime: null, endTime: null } : { tournamentMode: mode });

            }}
          >
            <SelectTrigger className="h-[42px] w-full rounded-[12px] border-[#e1e3e8] bg-[#f9fafc] px-[15px] text-[16px] font-medium text-[#010a04] sm:h-[46px]">
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

        <div className="space-y-3">
          <Label className="text-[15px] font-medium text-[#010a04]">
            {t("tournaments.selectClub")}
          </Label>
          <p className="text-[14px] leading-[1.4] text-[#010a04]/60">
            {t("tournaments.selectClubHint")}
          </p>
          <Select value={form.club} onValueChange={(v) => update({ club: v, sponsor: null })}>
            <SelectTrigger className="h-[42px] w-full rounded-[12px] border-[#e1e3e8] bg-[#f9fafc] px-[15px] text-[16px] font-medium text-[#010a04] sm:h-[46px]">
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
            <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
              <div>
                <Label className="text-[15px] font-medium text-[#010a04]">
                  {t("tournaments.date")} *
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "mt-[10px] h-[42px] w-full justify-between rounded-[12px] border-[#e1e3e8] bg-[#f9fafc] px-[15px] text-left text-[14px] font-normal text-[#010a04] sm:h-[46px]",
                        !selectedDate && "text-[#010a04]/50"
                      )}
                    >
                      <span>
                        {selectedDate
                          ? format(selectedDate, "dd/MM/yyyy")
                          : t("tournaments.datePlaceholder")}
                      </span>
                      <CalendarIcon className="h-5 w-5 shrink-0 text-[#010a04]/65" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => update({ date: date ? format(date, "yyyy-MM-dd") : null })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label className="text-[15px] font-medium text-[#010a04]">
                  {t("tournaments.startTime")} *
                </Label>
                <div className="mt-[10px]">
                  <TimePicker
                    value={form.startTime ?? null}
                    onChange={(time) => update({ startTime: time })}
                    placeholder="00:00 AM"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
              <div>
                <Label className="text-[15px] font-medium text-[#010a04]">
                  {t("tournaments.endTime")} *
                </Label>
                <div className="mt-[10px]">
                  <TimePicker
                    value={form.endTime ?? null}
                    onChange={(time) => update({ endTime: time })}
                    placeholder="00:00 AM"
                  />
                </div>
              </div>

              <div aria-hidden="true" className="hidden sm:block" />
            </div>

          </>
        )}

        <div className="space-y-[10px]">
          <Label className="text-[15px] font-medium text-[#010a04]">
            {t("tournaments.description")}
          </Label>
          <textarea
            placeholder={t("tournaments.descriptionPlaceholder")}
            value={form.descriptionInfo ?? ""}
            onChange={(e) => update({ descriptionInfo: e.target.value })}
            className="h-[90px] w-full rounded-[12px] border border-[#e1e3e8] bg-[#f9fafc] px-[15px] py-[15px] text-[14px] text-[#010a04] placeholder:text-[#010a04]/50 sm:h-[110px]"
          />
        </div>
      </div>
    </TabsContent>
  );
}
