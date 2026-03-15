import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "./input";

interface TimePickerProps {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  stepMinutes?: number;
  placeholder?: string;
  disabled?: boolean;
  popoverAlign?: "start" | "center" | "end";
  /** Override placeholder (default: timepicker.placeholder) */
  placeholderLabel?: string;
  /** Override popover title (default: timepicker.title) */
  titleLabel?: string;
  /** Override hour field label (default: timepicker.hour) */
  hourLabel?: string;
  /** Override minute field label (default: timepicker.minute) */
  minuteLabel?: string;
  /** Override AM label (default: timepicker.am) */
  amLabel?: string;
  /** Override PM label (default: timepicker.pm) */
  pmLabel?: string;
  /** Override clear button (default: timepicker.clear) */
  clearLabel?: string;
  /** Override now button (default: timepicker.now) */
  nowLabel?: string;
  /** Override confirm/done button (default: timepicker.confirm) */
  confirmLabel?: string;
}

type Meridian = "AM" | "PM";

export function TimePicker({
  value,
  onChange,
  stepMinutes = 5,
  placeholder,
  disabled,
  popoverAlign = "start",
  placeholderLabel,
  titleLabel,
  hourLabel,
  minuteLabel,
  amLabel,
  pmLabel,
  clearLabel,
  nowLabel,
  confirmLabel,
}: TimePickerProps) {
  const { t } = useTranslation();
  const effectivePlaceholder = placeholder ?? placeholderLabel ?? t("timepicker.placeholder");
  const effectiveTitle = titleLabel ?? t("timepicker.title");
  const effectiveHourLabel = hourLabel ?? t("timepicker.hour");
  const effectiveMinuteLabel = minuteLabel ?? t("timepicker.minute");
  const effectiveAmLabel = amLabel ?? t("timepicker.am");
  const effectivePmLabel = pmLabel ?? t("timepicker.pm");
  const effectiveClearLabel = clearLabel ?? t("timepicker.clear");
  const effectiveNowLabel = nowLabel ?? t("timepicker.now");
  const effectiveConfirmLabel = confirmLabel ?? t("timepicker.confirm");

  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const hourInputRef = useRef<HTMLInputElement | null>(null);
  const minuteInputRef = useRef<HTMLInputElement | null>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  const parsedValue = useMemo(() => {
    if (!value) return null;
    const match = value.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (Number.isNaN(hour) || Number.isNaN(minute) || hour > 23 || minute > 59) return null;
    return { hour, minute };
  }, [value]);

  const selectedHour24 = parsedValue?.hour ?? 0;
  const selectedHour = selectedHour24 % 12 || 12;
  const selectedMeridian: Meridian = selectedHour24 >= 12 ? "PM" : "AM";
  const selectedMinute = parsedValue?.minute ?? 0;
  const formatted = parsedValue
    ? `${String(selectedHour).padStart(2, "0")}:${String(selectedMinute).padStart(2, "0")} ${selectedMeridian}`
    : "";

  const formatTime = (hour: number, minute: number) =>
    `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

  const to24Hour = (hour: number, meridian: Meridian) => {
    if (meridian === "AM") return hour === 12 ? 0 : hour;
    return hour === 12 ? 12 : hour + 12;
  };

  const setHour = (hour: number) => onChange(formatTime(to24Hour(hour, selectedMeridian), selectedMinute));
  const setMinute = (minute: number) => onChange(formatTime(selectedHour24, minute));
  const setMeridian = (meridian: Meridian) =>
    onChange(formatTime(to24Hour(selectedHour, meridian), selectedMinute));

  const setNow = () => {
    const now = new Date();
    const minute = Math.floor(now.getMinutes() / stepMinutes) * stepMinutes;
    onChange(formatTime(now.getHours(), minute));
  };

  useEffect(() => {
    if (!open) return;
    const dialogContent = triggerRef.current?.closest("[data-slot='dialog-content']");
    setPortalContainer(dialogContent instanceof HTMLElement ? dialogContent : null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    // Defer focus until after popover content has mounted
    const id = window.setTimeout(() => {
      if (hourInputRef.current) {
        hourInputRef.current.focus();
        hourInputRef.current.select();
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, [open]);

  const hourDisplay = String(selectedHour).padStart(2, "0");
  const minuteDisplay = String(selectedMinute).padStart(2, "0");
  const [hourInput, setHourInput] = useState(hourDisplay);
  const [minuteInput, setMinuteInput] = useState(minuteDisplay);

  useEffect(() => {
    setHourInput(hourDisplay);
    setMinuteInput(minuteDisplay);
  }, [hourDisplay, minuteDisplay]);

  const commitHourInput = (raw: string) => {
    if (!raw) {
      setHourInput(hourDisplay);
      return;
    }
    let next = Number(raw);
    if (Number.isNaN(next)) {
      setHourInput(hourDisplay);
      return;
    }
    if (next < 1) next = 1;
    if (next > 12) next = 12;
    setHour(next);
    setHourInput(String(next).padStart(2, "0"));
  };

  const commitMinuteInput = (raw: string) => {
    if (!raw) {
      setMinuteInput(minuteDisplay);
      return;
    }
    let next = Number(raw);
    if (Number.isNaN(next)) {
      setMinuteInput(minuteDisplay);
      return;
    }
    if (next < 0) next = 0;
    if (next > 59) next = 59;
    setMinute(next);
    setMinuteInput(String(next).padStart(2, "0"));
  };

  const nudgeHour = (delta: 1 | -1) => {
    const current = selectedHour;
    const wrapped = current + delta < 1 ? 12 : current + delta > 12 ? 1 : current + delta;
    setHour(wrapped);
    setHourInput(String(wrapped).padStart(2, "0"));
  };

  const nudgeMinute = (delta: 1 | -1) => {
    const increment = Math.max(1, stepMinutes);
    const next = (selectedMinute + delta * increment + 60) % 60;
    setMinute(next);
    setMinuteInput(String(next).padStart(2, "0"));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-10 w-full justify-between rounded-lg border-[#e5e7eb] px-3 text-left text-[14px] font-normal",
            !formatted && "text-[#9ca3af]"
          )}
        >
          <span>{formatted || effectivePlaceholder}</span>
          <Clock className="h-4 w-4 shrink-0 text-[#9ca3af]" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[320px] rounded-xl border border-[#e5e7eb] p-0"
        align={popoverAlign}
        container={portalContainer}
      >
        <div className="border-b border-[#e5e7eb] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-[#6b7280]">{effectiveTitle}</p>
            <div className="inline-flex h-8 rounded-lg border border-[#d1d5db] bg-[#f3f4f6] p-0.5">
              {(["AM", "PM"] as const).map((meridian) => {
                const isActive = meridian === selectedMeridian;
                return (
                  <button
                    key={meridian}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setMeridian(meridian)}
                    className={cn(
                      "min-w-[56px] rounded-md px-3 text-[12px] font-medium transition-colors",
                      isActive
                        ? "bg-white text-[#111827] shadow-[0_1px_2px_rgba(0,0,0,0.12)]"
                        : "text-[#6b7280] hover:text-[#374151]"
                    )}
                  >
                    {meridian === "AM" ? effectiveAmLabel : effectivePmLabel}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-center gap-2">
            <Input
              ref={hourInputRef}
              type="text"
              inputMode="numeric"
              aria-label={effectiveHourLabel}
              maxLength={2}
              value={hourInput}
              onChange={(event) => {
                const raw = event.target.value.replace(/\D/g, "").slice(0, 2);
                setHourInput(raw);
                if (raw.length === 2) {
                  commitHourInput(raw);
                  minuteInputRef.current?.focus();
                }
              }}
              onFocus={(event) => event.currentTarget.select()}
              onBlur={() => commitHourInput(hourInput)}
              onKeyDown={(event) => {
                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  nudgeHour(1);
                }
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  nudgeHour(-1);
                }
                if (event.key === "Enter") {
                  event.preventDefault();
                  commitHourInput(hourInput);
                  minuteInputRef.current?.focus();
                }
              }}
              className={cn(
                "h-14 min-w-[82px] rounded-lg border text-center text-[28px] font-semibold leading-none outline-none transition-colors",
                "border-[#0a9f43] bg-[#e8f7ee] text-[#065f46]"
              )}
            />
            <span className="pb-1 text-[28px] font-semibold text-[#6b7280]">:</span>
            <Input
              ref={minuteInputRef}
              type="text"
              inputMode="numeric"
              aria-label={effectiveMinuteLabel}
              maxLength={2}
              value={minuteInput}
              onChange={(event) => {
                const raw = event.target.value.replace(/\D/g, "").slice(0, 2);
                setMinuteInput(raw);
                if (raw.length === 2) commitMinuteInput(raw);
              }}
              onFocus={(event) => event.currentTarget.select()}
              onBlur={() => commitMinuteInput(minuteInput)}
              onKeyDown={(event) => {
                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  nudgeMinute(1);
                }
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  nudgeMinute(-1);
                }
                if (event.key === "Enter") {
                  event.preventDefault();
                  commitMinuteInput(minuteInput);
                }
              }}
              className={cn(
                "h-14 min-w-[82px] rounded-lg border text-center text-[28px] font-semibold leading-none outline-none transition-colors",
                "border-[#e5e7eb] bg-[#f9fafb] text-[#1f2937] focus:border-[#0a9f43] focus:bg-[#e8f7ee] focus:text-[#065f46]"
              )}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-[#e5e7eb] p-3">
          <Button
            type="button"
            variant="outline"
            className="h-8 flex-1 rounded-md text-[12px]"
            onClick={() => onChange(null)}
          >
            {effectiveClearLabel}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-8 flex-1 rounded-md text-[12px]"
            onClick={setNow}
          >
            {effectiveNowLabel}
          </Button>
          <Button
            type="button"
            className="h-8 flex-1 rounded-md bg-[#0a9f43] text-[12px] text-white hover:bg-[#088a3a]"
            onClick={() => setOpen(false)}
          >
            {effectiveConfirmLabel}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

