import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
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
  /** Optional i18n keys for warning toasts. Defaults to timepicker.* keys. */
  warningKeys?: {
    invalidInput?: string;
    noAvailableSlots?: string;
    outOfBounds?: string;
  };
  /** Passed to the trigger button for a11y (e.g. link to an external Label via aria-labelledby) */
  id?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  /** When false, hides Clear so the value cannot be emptied (e.g. required API fields). Default true. */
  allowClear?: boolean;
  /** Merged onto the trigger button after default styles (e.g. match a {@link SelectTrigger} on the same row). */
  triggerClassName?: string;
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
  warningKeys,
  id,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
  allowClear = true,
  triggerClassName,
}: TimePickerProps) {
  const { t } = useTranslation();

  const bounds = useMemo(
    () => resolveTimeBoundsMinutes(minTime, maxTime, { minExclusive, maxExclusive }),
    [minTime, maxTime, minExclusive, maxExclusive]
  );
  const effectivePlaceholder = placeholder ?? placeholderLabel ?? t("timepicker.placeholder");
  const effectiveTitle = titleLabel ?? t("timepicker.title");
  const effectiveHourLabel = hourLabel ?? t("timepicker.hour");
  const effectiveMinuteLabel = minuteLabel ?? t("timepicker.minute");
  const effectiveAmLabel = amLabel ?? t("timepicker.am");
  const effectivePmLabel = pmLabel ?? t("timepicker.pm");
  const effectiveClearLabel = clearLabel ?? t("timepicker.clear");
  const effectiveNowLabel = nowLabel ?? t("timepicker.now");
  const effectiveConfirmLabel = confirmLabel ?? t("timepicker.confirm");
  const warningInvalidInputKey = warningKeys?.invalidInput ?? "timepicker.invalidInput";
  const warningNoAvailableSlotsKey = warningKeys?.noAvailableSlots ?? "timepicker.noAvailableSlots";
  const warningOutOfBoundsKey = warningKeys?.outOfBounds ?? "timepicker.outOfBounds";

  const [open, setOpen] = useState(false);
  /** 12h AM/PM while the popover is open; committed only on Done (with validation). */
  const [draftMeridian, setDraftMeridian] = useState<Meridian>("AM");
  const hourFieldId = useId();
  const minuteFieldId = useId();

  const focusMinuteField = useCallback(() => {
    document.getElementById(minuteFieldId)?.focus();
  }, [minuteFieldId]);

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

  const rejectAndSyncInputs = useCallback(() => {
    setHourInput(String(selectedHour).padStart(2, "0"));
    setMinuteInput(String(selectedMinute).padStart(2, "0"));
    setDraftMeridian(selectedMeridian);
  }, [selectedHour, selectedMinute, selectedMeridian]);

  /** Sync hour/minute text inputs to a proposed total-minutes value (12h display). */
  const syncInputsToTotalMinutes = useCallback((totalMinutes: number) => {
    const hour24 = ((Math.floor(totalMinutes / 60) % 24) + 24) % 24;
    const minute = ((totalMinutes % 60) + 60) % 60;
    const hour12 = hour24 % 12 || 12;
    setHourInput(String(hour12).padStart(2, "0"));
    setMinuteInput(String(minute).padStart(2, "0"));
  }, []);

  const hasSelectableTime = hasNonEmptyTimeBounds(bounds);

  const notifyTimeConstraint = useCallback((messageKey: string) => {
    toast.warning(t(messageKey), {
      id: "timepicker-constraint",
      duration: 3800,
    });
  }, [t]);

  /** Validates bounds / step window and writes to the parent — used for Clear and Done only. */
  const proposeTime = (next: string | null): boolean => {
    if (next === null) {
      onChange(null);
      syncInputsToTotalMinutes(0);
      setDraftMeridian("AM");
      return true;
    }
    const m = time24ToMinutes(next);
    if (m === null) {
      notifyTimeConstraint(warningInvalidInputKey);
      return false;
    }
    if (!hasSelectableTime) {
      notifyTimeConstraint(warningNoAvailableSlotsKey);
      return false;
    }
    if (!isMinutesWithinTimeBounds(m, bounds)) {
      notifyTimeConstraint(warningOutOfBoundsKey);
      return false;
    }
    onChange(minutesToTime24(m));
    syncInputsToTotalMinutes(m);
    setDraftMeridian(m >= 12 * 60 ? "PM" : "AM");
    return true;
  };

  /** Fills draft fields from “now”, clamped into the allowed window when possible (commit on Done). */
  const setNow = () => {
    if (!hasSelectableTime) {
      notifyTimeConstraint(warningNoAvailableSlotsKey);
      return;
    }

    const now = new Date();
    const effectiveStep = Math.max(1, stepMinutes);
    const minute = Math.floor(now.getMinutes() / effectiveStep) * effectiveStep;
    let m = now.getHours() * 60 + minute;
    if (!isMinutesWithinTimeBounds(m, bounds)) {
      if (bounds.minMinutes !== null && m < bounds.minMinutes) m = bounds.minMinutes;
      else if (bounds.maxMinutes !== null && m > bounds.maxMinutes) m = bounds.maxMinutes;
      if (!isMinutesWithinTimeBounds(m, bounds)) {
        notifyTimeConstraint(warningOutOfBoundsKey);
        return;
      }
    }
    syncInputsToTotalMinutes(m);
    setDraftMeridian(m >= 12 * 60 ? "PM" : "AM");
  };

  const confirmDraft = (): boolean => {
    const rawH = hourInput.replace(/\D/g, "");
    const rawM = minuteInput.replace(/\D/g, "");
    if (rawH === "" || rawM === "") {
      notifyTimeConstraint(warningInvalidInputKey);
      return false;
    }
    const h12 = Number(rawH);
    const min = Number(rawM);
    if (Number.isNaN(h12) || Number.isNaN(min)) {
      notifyTimeConstraint(warningInvalidInputKey);
      return false;
    }
    if (h12 < 1 || h12 > 12) {
      notifyTimeConstraint(warningInvalidInputKey);
      return false;
    }
    if (min < 0 || min > 59) {
      notifyTimeConstraint(warningInvalidInputKey);
      return false;
    }
    const timeStr = formatTime(to24Hour(h12, draftMeridian), min);
    return proposeTime(timeStr);
  };

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      const el = document.getElementById(hourFieldId);
      if (el instanceof HTMLInputElement) {
        el.focus();
        el.select();
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [open, hourFieldId]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setHourInput(hourDisplay);
      setMinuteInput(minuteDisplay);
      setDraftMeridian(selectedMeridian);
    }
    setOpen(nextOpen);
  };

  /** Draft hour: pad only when 1–12; empty/invalid stays for confirmDraft to reject. */
  const commitHourInput = (raw: string) => {
    if (raw === "") {
      setHourInput("");
      return;
    }
    const next = Number(raw);
    if (Number.isNaN(next) || next < 1 || next > 12) {
      setHourInput(raw);
      return;
    }
    setHourInput(String(next).padStart(2, "0"));
  };

  /** Draft minute: pad only when 0–59; empty/invalid stays for confirmDraft to reject. */
  const commitMinuteInput = (raw: string) => {
    if (raw === "") {
      setMinuteInput("");
      return;
    }
    const next = Number(raw);
    if (Number.isNaN(next) || next < 0 || next > 59) {
      setMinuteInput(raw);
      return;
    }
    setMinuteInput(String(next).padStart(2, "0"));
  };

  const nudgeHour = (delta: 1 | -1) => {
    let current = Number.parseInt(hourInput.replace(/\D/g, ""), 10);
    if (Number.isNaN(current) || current < 1 || current > 12) {
      current = selectedHour;
    }
    const wrapped = current + delta < 1 ? 12 : current + delta > 12 ? 1 : current + delta;
    setHourInput(String(wrapped).padStart(2, "0"));
  };

  const nudgeMinute = (delta: 1 | -1) => {
    const increment = Math.max(1, stepMinutes);
    const sm = Number.parseInt(minuteInput.replace(/\D/g, ""), 10);
    const base = Number.isNaN(sm) ? selectedMinute : sm;
    const next = (base + delta * increment + 60) % 60;
    setMinuteInput(String(next).padStart(2, "0"));
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ariaDescribedBy}
          className={cn(
            "h-[38px] w-full min-w-0 max-w-full justify-between gap-2 overflow-hidden rounded-[10px] border border-[#e1e3e8] bg-[#f9fafc] px-3 py-0 text-left text-[13px] font-normal leading-normal text-[#010a04] shadow-none hover:bg-[#f9fafc] sm:h-[46px] sm:rounded-[12px] sm:px-[15px] sm:text-[14px]",
            !formatted && "text-[#010a04]/50",
            triggerClassName
          )}
        >
          <span className="min-w-0 truncate leading-normal">{formatted || effectivePlaceholder}</span>
          <Clock className="h-4 w-4 shrink-0 text-[#010a04]/65 sm:h-5 sm:w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="z-[100] w-[min(100vw-1.5rem,320px)] max-w-[320px] rounded-xl border border-[#e5e7eb] p-0"
        align={popoverAlign}
        side="bottom"
        sideOffset={6}
        collisionPadding={12}
        sticky="partial"
      >
        <div className="border-b border-[#e5e7eb] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-[#6b7280]">{effectiveTitle}</p>
            <div className="inline-flex h-8 rounded-lg border border-[#d1d5db] bg-[#f3f4f6] p-0.5">
              {(["AM", "PM"] as const).map((meridian) => {
                const isActive = meridian === draftMeridian;
                return (
                  <button
                    key={meridian}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setDraftMeridian(meridian)}
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
              id={hourFieldId}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              aria-label={effectiveHourLabel}
              maxLength={2}
              value={hourInput}
              onChange={(event) => {
                const raw = event.target.value.replace(/\D/g, "").slice(0, 2);
                if (raw.length === 2) {
                  flushSync(() => {
                    commitHourInput(raw);
                  });
                  focusMinuteField();
                } else {
                  setHourInput(raw);
                }
              }}
              onFocus={(event) => event.currentTarget.select()}
              onBlur={(event) => {
                const raw = event.currentTarget.value.replace(/\D/g, "").slice(0, 2);
                commitHourInput(raw);
              }}
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
                  const raw = event.currentTarget.value.replace(/\D/g, "").slice(0, 2);
                  flushSync(() => {
                    commitHourInput(raw);
                  });
                  focusMinuteField();
                }
              }}
              className={cn(
                "h-14 min-w-[82px] rounded-lg border text-center text-[28px] font-semibold leading-none outline-none transition-colors",
                "border-[#0a9f43] bg-[#e8f7ee] text-[#065f46]"
              )}
            />
            <span className="pb-1 text-[28px] font-semibold text-[#6b7280]">:</span>
            <Input
              id={minuteFieldId}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              aria-label={effectiveMinuteLabel}
              maxLength={2}
              value={minuteInput}
              onChange={(event) => {
                const raw = event.target.value.replace(/\D/g, "").slice(0, 2);
                if (raw.length === 2) {
                  flushSync(() => {
                    commitMinuteInput(raw);
                  });
                } else {
                  setMinuteInput(raw);
                }
              }}
              onFocus={(event) => event.currentTarget.select()}
              onBlur={(event) => {
                const raw = event.currentTarget.value.replace(/\D/g, "").slice(0, 2);
                commitMinuteInput(raw);
              }}
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
                  const raw = event.currentTarget.value.replace(/\D/g, "").slice(0, 2);
                  flushSync(() => {
                    commitMinuteInput(raw);
                  });
                  const ok = confirmDraft();
                  if (ok) {
                    handleOpenChange(false);
                  } else {
                    rejectAndSyncInputs();
                  }
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
          {allowClear ? (
            <Button
              type="button"
              variant="outline"
              className="h-8 flex-1 rounded-md text-[12px]"
              onClick={() => {
                const ok = proposeTime(null);
                if (!ok) rejectAndSyncInputs();
              }}
            >
              {effectiveClearLabel}
            </Button>
          ) : null}
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
            onClick={() => {
              const ok = confirmDraft();
              if (ok) {
                handleOpenChange(false);
              } else {
                rejectAndSyncInputs();
              }
            }}
          >
            {effectiveConfirmLabel}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

