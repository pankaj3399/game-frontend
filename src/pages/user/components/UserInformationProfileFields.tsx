import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Field, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar03Icon, UserIcon } from "@hugeicons/core-free-icons";
import { USER_INFORMATION_INPUT_CLASSNAME } from "@/pages/user/constants";

interface UserInformationProfileFieldsProps {
  dateOfBirth: Date | undefined;
  gender: "male" | "female" | "other" | "" | undefined;
  dateOfBirthError?: string;
  genderError?: string;
  onDateOfBirthChange: (date: Date | undefined) => void;
  onGenderChange: (value: string) => void;
}

export function UserInformationProfileFields({
  dateOfBirth,
  gender,
  dateOfBirthError,
  genderError,
  onDateOfBirthChange,
  onGenderChange,
}: UserInformationProfileFieldsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <Field className="flex flex-col gap-2">
        <FieldLabel
          htmlFor="signup-dob"
          className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[#6b7280]"
        >
          <HugeiconsIcon icon={Calendar03Icon} size={14} />
          {t("signup.dateOfBirth")}
        </FieldLabel>
        <Popover>
          <PopoverTrigger type="button" asChild>
            <Button
              id="signup-dob"
              variant="outline"
              className={`${USER_INFORMATION_INPUT_CLASSNAME} justify-start text-left font-normal`}
              aria-invalid={!!dateOfBirthError}
              aria-describedby={dateOfBirthError ? "signup-dob-error" : undefined}
            >
              <HugeiconsIcon icon={Calendar03Icon} size={18} className="mr-2 shrink-0" />
              {dateOfBirth ? (
                format(dateOfBirth, "dd/MM/yyyy")
              ) : (
                <span className="text-muted-foreground">
                  {t("signup.selectDateOfBirth")}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateOfBirth}
              onSelect={onDateOfBirthChange}
              disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
              autoFocus
              captionLayout="dropdown"
            />
          </PopoverContent>
        </Popover>
        {dateOfBirthError ? (
          <span id="signup-dob-error" className="text-sm text-destructive" aria-live="polite">
            {dateOfBirthError}
          </span>
        ) : null}
      </Field>

      <Field className="gap-2">
        <FieldLabel
          htmlFor="gender-select-trigger"
          className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[#6b7280]"
        >
          <HugeiconsIcon icon={UserIcon} size={14} />
          {t("signup.gender")}
        </FieldLabel>
        <Select value={gender || undefined} onValueChange={onGenderChange}>
          <SelectTrigger
            id="gender-select-trigger"
            className={`${USER_INFORMATION_INPUT_CLASSNAME} h-11 justify-between`}
            aria-invalid={!!genderError}
            aria-describedby={genderError ? "gender-error" : undefined}
          >
            <SelectValue placeholder={t("signup.selectGender")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">{t("signup.male")}</SelectItem>
            <SelectItem value="female">{t("signup.female")}</SelectItem>
            <SelectItem value="other">{t("signup.other")}</SelectItem>
          </SelectContent>
        </Select>
        {genderError ? (
          <span id="gender-error" className="text-sm text-destructive" aria-live="polite">
            {genderError}
          </span>
        ) : null}
      </Field>
    </div>
  );
}
