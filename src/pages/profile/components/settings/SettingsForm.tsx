import { useState, type ChangeEvent, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
import { type AuthUser } from "@/contexts/auth";
import { useUpdateProfile } from "@/pages/profile/hooks";
import InlineLoader from "@/components/shared/InlineLoader";
import { Calendar03Icon } from "@/icons/figma-icons";
import { toast } from "sonner";
import { formatDateForApi, parseIsoDateSafely } from "@/utils/date";

const inputClassName =
  "h-[38px] w-full rounded-[8px] border border-[#e1e3e8] bg-[#f9fafc] px-3 text-[14px] text-[#010a04] placeholder:text-[#010a04]/45 transition-colors focus-visible:border-[#9ca3af] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#9ca3af] disabled:opacity-100";

function getInitialInputs(user: AuthUser) {
  const dob = user.dateOfBirth ? parseIsoDateSafely(String(user.dateOfBirth)) ?? undefined : undefined;
  return {
    alias: user.alias ?? "",
    name: user.name ?? "",
    dateOfBirth: dob,
    gender: (user.gender as "male" | "female" | "other" | "") ?? "",
  };
}

export function SettingsForm({ user }: { user: AuthUser }) {
  const { t } = useTranslation();
  const [inputs, setInputs] = useState(() => getInitialInputs(user));
  const { updateProfile, isLoading } = useUpdateProfile();

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    const dateValue = formatDateForApi(inputs.dateOfBirth) || null;

    const result = await updateProfile({
      alias: inputs.alias,
      name: inputs.name,
      dateOfBirth: dateValue,
      gender: inputs.gender || null,
    });

    if (result.success) {
      toast.success(t("settings.saveSuccess"));
    } else {
      toast.error(result.message);
    }
  };

  return (
    <>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-[20px] font-semibold leading-none text-[#010a04]">
          {t("settings.title")}
        </h2>
        <Button
          type="submit"
          form="settings-form"
          disabled={isLoading}
          className="h-[30px] shrink-0 rounded-[8px] border border-[rgba(1,10,4,0.12)] bg-brand-accent px-[15px] text-[12px] font-medium text-[#010a04] hover:bg-brand-accent-hover"
        >
          <span className="inline-flex items-center gap-2">
            {isLoading && <InlineLoader size="sm" className="shrink-0" />}
            <span>{t("settings.saveChanges")}</span>
          </span>
        </Button>
      </div>
      <form id="settings-form" onSubmit={handleSave} className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field className="gap-[10px]">
            <FieldLabel
              htmlFor="settings-email"
              className="text-[12px] font-medium uppercase tracking-normal text-[#010a04]/70"
            >
              {t("signup.emailAddress")}
            </FieldLabel>
            <Input
              id="settings-email"
              type="email"
              disabled
              className={inputClassName}
              value={user.email ?? ""}
            />
          </Field>

          <Field className="gap-[10px]">
            <FieldLabel
              htmlFor="settings-alias"
              className="text-[12px] font-medium uppercase tracking-normal text-[#010a04]/70"
            >
              {t("signup.alias")}
            </FieldLabel>
            <Input
              id="settings-alias"
              type="text"
              name="alias"
              className={inputClassName}
              value={inputs.alias}
              onChange={handleInputChange}
            />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field className="gap-[10px]">
            <FieldLabel
              htmlFor="settings-name"
              className="text-[12px] font-medium uppercase tracking-normal text-[#010a04]/70"
            >
              {t("signup.name")}
            </FieldLabel>
            <Input
              id="settings-name"
              type="text"
              name="name"
              className={inputClassName}
              value={inputs.name}
              onChange={handleInputChange}
            />
          </Field>

          <Field className="gap-[10px]">
            <FieldLabel
              htmlFor="settings-dob"
              className="text-[12px] font-medium uppercase tracking-normal text-[#010a04]/70"
            >
              {t("settings.dateOfBirthOptional")}
            </FieldLabel>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="settings-dob"
                  type="button"
                  variant="outline"
                  className={`${inputClassName} justify-between border-[#e1e3e8] text-left font-medium hover:bg-[#f9fafc]`}
                >
                  {inputs.dateOfBirth ? (
                    <span>{format(inputs.dateOfBirth, "dd/MM/yyyy")}</span>
                  ) : (
                    <span className="text-[#010a04]/45">{t("signup.selectDateOfBirth")}</span>
                  )}
                  <Calendar03Icon size={16} className="ml-2 shrink-0 text-[#010a04]/60" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={inputs.dateOfBirth}
                  onSelect={(date) =>
                    setInputs((prev) => ({ ...prev, dateOfBirth: date }))
                  }
                  disabled={(date) =>
                    date > new Date() || date < new Date("1900-01-01")
                  }
                  autoFocus
                  captionLayout="dropdown"
                />
              </PopoverContent>
            </Popover>
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field className="gap-[10px]">
            <FieldLabel
              htmlFor="settings-gender"
              className="text-[12px] font-medium uppercase tracking-normal text-[#010a04]/70"
            >
              {t("settings.genderOptional")}
            </FieldLabel>
            <Select
              value={inputs.gender || undefined}
              onValueChange={(value) =>
                setInputs((prev) => ({
                  ...prev,
                  gender: value === "male" || value === "female" || value === "other" ? value : "",
                }))
              }
            >
              <SelectTrigger id="settings-gender" className={`${inputClassName} justify-between`}>
                <SelectValue placeholder={t("signup.selectGender")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">{t("signup.male")}</SelectItem>
                <SelectItem value="female">{t("signup.female")}</SelectItem>
                <SelectItem value="other">{t("signup.other")}</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <div className="hidden sm:block" aria-hidden />
        </div>
      </form>
    </>
  );
}
