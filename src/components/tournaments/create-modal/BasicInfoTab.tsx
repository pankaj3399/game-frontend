import { useTranslation } from "react-i18next";
import { format, isValid, parseISO } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CreateTournamentInput } from "@/hooks/tournament";
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

const TOURNAMENT_MODES = ["singleDay", "period"] as const;

type Club = { id: string; name: string };

interface BasicInfoTabProps {
  form: CreateTournamentInput;
  clubs: Club[];
  update: (updates: Partial<CreateTournamentInput>) => void;
}

export function BasicInfoTab({ form, clubs, update }: BasicInfoTabProps) {
  const { t } = useTranslation();

  const parsedDate = form.date
    ? (() => {
      try {
        const parsed = typeof form.date === "string" ? parseISO(form.date) : new Date(form.date);
        return isValid(parsed) ? parsed : undefined;
      } catch {
        return undefined;
      }
    })()
    : undefined;

  return (
    <TabsContent value="basic" className="mt-0">
      <div className="space-y-4">
        <div>
          <Label className="text-[14px] font-medium text-[#111827]">
            {t("tournaments.tournamentName")} *
          </Label>
          <Input
            placeholder={t("tournaments.enterName")}
            value={form.name}
            onChange={(e) => update({ name: e.target.value })}
            className="mt-1 h-10 rounded-lg border-[#e5e7eb] text-[14px] placeholder:text-[#9ca3af]"
          />
        </div>

        <div>
          <Label className="text-[14px] font-medium text-[#111827]">
            {t("tournaments.tournamentType")} *
          </Label>
          <Select
            value={form.tournamentMode}
            onValueChange={(v) => {
              const mode = v;
              update(mode === "period" ? { tournamentMode: mode, date: null, startTime: null, endTime: null } : { tournamentMode: mode });

            }}
          >
            <SelectTrigger className="mt-1 h-10 w-full rounded-lg border-[#e5e7eb] text-[14px] font-normal">
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

        <div>
          <Label className="text-[14px] font-medium text-[#111827]">
            {t("tournaments.selectClub")} *
          </Label>
          <p className="mt-0.5 text-xs leading-4 text-[#6b7280]">
            {t("tournaments.selectClubHint")}
          </p>
          <Select value={form.club} onValueChange={(v) => update({ club: v, sponsorId: null })}>
            <SelectTrigger className="mt-1 h-10 w-full rounded-lg border-[#e5e7eb] text-[14px] font-normal">
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
            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label className="text-[14px] font-medium text-[#111827]">
                  {t("tournaments.date")} *
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "mt-1 h-10 w-full justify-between rounded-lg border-[#e5e7eb] px-3 text-left text-[14px] font-normal",
                        !parsedDate && "text-[#9ca3af]"
                      )}
                    >
                      <span>
                        {parsedDate
                          ? format(parsedDate, "dd/MM/yyyy")
                          : t("tournaments.datePlaceholder")}
                      </span>
                      <CalendarIcon className="h-4 w-4 shrink-0 text-[#9ca3af]" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={parsedDate}
                      onSelect={(date) => update({ date: date ? format(date, "yyyy-MM-dd") : null })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[14px] font-medium text-[#111827]">
                  {t("tournaments.startTime")} *
                </Label>
                <div className="mt-1">
                  <TimePicker
                    value={form.startTime ?? null}
                    onChange={(time) => update({ startTime: time })}
                    placeholder={t("tournaments.timePlaceholder")}
                  />
                </div>
              </div>

              <div>
                <Label className="text-[14px] font-medium text-[#111827]">
                  {t("tournaments.endTime")} *
                </Label>
                <div className="mt-1">
                  <TimePicker
                    value={form.endTime ?? null}
                    onChange={(time) => update({ endTime: time })}
                    placeholder={t("tournaments.timePlaceholder")}
                    popoverAlign="end"
                  />
                </div>
              </div>
            </div>

          </>
        )}

        <div>
          <Label className="text-[14px] font-medium text-[#111827]">
            {t("tournaments.description")}
          </Label>
          <textarea
            placeholder={t("tournaments.descriptionPlaceholder")}
            value={form.descriptionInfo ?? ""}
            onChange={(e) => update({ descriptionInfo: e.target.value })}
            className="mt-1 min-h-[92px] w-full rounded-lg border border-[#e5e7eb] bg-transparent px-3 py-2 text-[14px] placeholder:text-[#9ca3af]"
          />
        </div>
      </div>
    </TabsContent>
  );
}
