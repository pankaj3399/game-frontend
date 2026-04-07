import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Clock } from "@/icons/figma-icons";
import { cn } from "@/lib/utils";
import {
  hasNonEmptyTimeBounds,
  isMinutesWithinTimeBounds,
  minutesToTime24,
  resolveTimeBoundsMinutes,
  time24ToMinutes,
} from "@/utils/time";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "./input";

interface TimePickerProps {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  /** Lower bound (HH:MM). Combine with {@link minExclusive} for strict ordering (e.g. end after start). */
  minTime?: string | null;
  /** Upper bound (HH:MM). Combine with {@link maxExclusive} for strict ordering (e.g. start before end). */
  maxTime?: string | null;
  /** When true, values must be strictly greater than {@link minTime} (first allowed minute is minTime + 1). */
  minExclusive?: boolean;
  /** When true, values must be strictly less than {@link maxTime} (last allowed minute is maxTime − 1). */
  maxExclusive?: boolean;
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
  /** Passed to the trigger button for a11y (e.g. link to an external Label via aria-labelledby) */
  id?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  /** When true, sets aria-required on the trigger (custom control, not a native required input). */
  required?: boolean;
}

type Meridian = "AM" | "PM";

export function TimePicker({
  value,
  onChange,
  minTime,
  maxTime,
  minExclusive = false,
  maxExclusive = false,
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
  id,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
  required,
}: TimePickerProps) {
  const { t } = useTranslation();

  const bounds = useMemo(
    () => resolveTimeBoundsMinutes(minTime, maxTime, { minExclusive, maxExclusive }),
    [minTime, maxTime, minExclusive, maxExclusive]
  );
  const hasValidRange = hasNonEmptyTimeBounds(bounds);
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
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const hourInputRef = useRef<HTMLInputElement | null>(null);
  const minuteInputRef = useRef<HTMLInputElement | null>(null);

  let parsedValue: { hour: number; minute: number } | null = null;
  if (value) {
    const match = value.match(/^(\d{1,2}):(\d{2})$/);
    if (match) {
      const hour = Number(match[1]);
      const minute = Number(match[2]);
      if (!Number.isNaN(hour) && !Number.isNaN(minute) && hour <= 23 && minute <= 59) {
        parsedValue = { hour, minute };
      }
    }
  }

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

  const hourDisplay = String(selectedHour).padStart(2, "0");
  const minuteDisplay = String(selectedMinute).padStart(2, "0");

  const [hourInput, setHourInput] = useState(hourDisplay);
  const [minuteInput, setMinuteInput] = useState(minuteDisplay);

  const proposeTime = useCallback(
    (next: string | null): boolean => {
      if (next === null) {
        onChange(null);
        return true;
      }
      const m = time24ToMinutes(next);
      if (m === null) return false;
      if (hasValidRange && !isMinutesWithinTimeBounds(m, bounds)) {
        return false;
      }
      onChange(minutesToTime24(m));
      return true;
    },
    [onChange, bounds, hasValidRange]
  );

  const rejectAndSyncInputs = useCallback(() => {
    setHourInput(String(selectedHour).padStart(2, "0"));
    setMinuteInput(String(selectedMinute).padStart(2, "0"));
  }, [selectedHour, selectedMinute]);

  const setHour = (hour: number) => {
    const ok = proposeTime(formatTime(to24Hour(hour, selectedMeridian), selectedMinute));
    if (!ok) rejectAndSyncInputs();
    return ok;
  };
  const setMinute = (minute: number) => {
    const ok = proposeTime(formatTime(selectedHour24, minute));
    if (!ok) rejectAndSyncInputs();
    return ok;
  };
  const setMeridian = (meridian: Meridian) => {
    const ok = proposeTime(formatTime(to24Hour(selectedHour, meridian), selectedMinute));
    if (!ok) rejectAndSyncInputs();
    return ok;
  };

  const setNow = () => {
    const now = new Date();
    let minute = Math.floor(now.getMinutes() / stepMinutes) * stepMinutes;
    let m = now.getHours() * 60 + minute;
    if (hasValidRange && !isMinutesWithinTimeBounds(m, bounds)) {
      if (bounds.minMinutes !== null && m < bounds.minMinutes) m = bounds.minMinutes;
      else if (bounds.maxMinutes !== null && m > bounds.maxMinutes) m = bounds.maxMinutes;
      if (!isMinutesWithinTimeBounds(m, bounds)) return;
    }
    const ok = proposeTime(minutesToTime24(m));
    if (!ok) rejectAndSyncInputs();
  };

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

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setHourInput(hourDisplay);
      setMinuteInput(minuteDisplay);
      const dialogContent = triggerRef.current?.closest("[data-slot='dialog-content']");
      setPortalContainer(dialogContent instanceof HTMLElement ? dialogContent : null);
    } else {
      setPortalContainer(null);
    }
    setOpen(nextOpen);
  };

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
    if (!setHour(next)) return;
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
    if (!setMinute(next)) return;
    setMinuteInput(String(next).padStart(2, "0"));
  };

  const nudgeHour = (delta: 1 | -1) => {
    const current = selectedHour;
    const wrapped = current + delta < 1 ? 12 : current + delta > 12 ? 1 : current + delta;
    if (!setHour(wrapped)) return;
    setHourInput(String(wrapped).padStart(2, "0"));
  };

  const nudgeMinute = (delta: 1 | -1) => {
    const increment = Math.max(1, stepMinutes);
    const next = (selectedMinute + delta * increment + 60) % 60;
    if (!setMinute(next)) return;
    setMinuteInput(String(next).padStart(2, "0"));
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ariaDescribedBy}
          aria-required={required ? true : undefined}
          className={cn(
            "h-[38px] w-full justify-between rounded-[10px] border-[#e1e3e8] bg-[#f9fafc] px-3 text-left text-[13px] font-normal text-[#010a04] sm:h-[46px] sm:rounded-[12px] sm:px-[15px] sm:text-[14px]",
            !formatted && "text-[#010a04]/50"
          )}
        >
          <span>{formatted || effectivePlaceholder}</span>
          <Clock className="h-4 w-4 shrink-0 text-[#010a04]/65 sm:h-5 sm:w-5" />
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
            onClick={() => proposeTime(null)}
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
            onClick={() => handleOpenChange(false)}
          >
            {effectiveConfirmLabel}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

