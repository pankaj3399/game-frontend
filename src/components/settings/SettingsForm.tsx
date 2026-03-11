import { useState, type ChangeEvent, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { format, parseISO, isValid } from "date-fns";
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
import { useAuth } from "@/hooks/auth";
import { type AuthUser } from "@/contexts/auth/AuthContext";
import { useUpdateProfile } from "@/hooks/user";
import { queryKeys } from "@/lib/api/queryKeys";
import InlineLoader from "@/components/shared/InlineLoader";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar03Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";

const inputClassName =
  "h-11 w-full rounded-lg border border-[#e5e7eb] bg-white px-4 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus-visible:border-[#9ca3af] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#9ca3af] disabled:opacity-60";

function getInitialInputs(user: AuthUser) {
  let dob: Date | undefined;
  if (user.dateOfBirth) {
    const parsed = parseISO(String(user.dateOfBirth));
    dob = isValid(parsed) ? parsed : undefined;
  }
  return {
    alias: user.alias ?? "",
    name: user.name ?? "",
    dateOfBirth: dob,
    gender: (user.gender as "male" | "female" | "other" | "") ?? "",
  };
}

export function SettingsForm({ user }: { user: AuthUser }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { checkAuth } = useAuth();
  const [inputs, setInputs] = useState(() => getInitialInputs(user));
  const { updateProfile, isLoading } = useUpdateProfile({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
      checkAuth();
    },
  });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    const dateValue = inputs.dateOfBirth
      ? new Date(
          Date.UTC(
            inputs.dateOfBirth.getFullYear(),
            inputs.dateOfBirth.getMonth(),
            inputs.dateOfBirth.getDate()
          )
        )
          .toISOString()
          .split("T")[0]
      : null;

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">{t("settings.title")}</h2>
        <Button
          type="button"
          onClick={handleSave}
          disabled={isLoading}
          className="h-10 px-5 rounded-lg font-medium shrink-0 bg-brand-accent text-black hover:bg-brand-accent-hover"
        >
       <span className="inline-flex items-center gap-2">
            {isLoading && <InlineLoader size="sm" className="shrink-0" />}
            <span>{t("settings.saveChanges")}</span>
          </span>
        </Button>
      </div>
      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-6">
            <Field className="gap-2">
              <FieldLabel
                htmlFor="settings-email"
                className="text-xs font-medium uppercase tracking-wider text-[#6b7280]"
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
            <Field className="gap-2">
              <FieldLabel
                htmlFor="settings-name"
                className="text-xs font-medium uppercase tracking-wider text-[#6b7280]"
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
            <Field className="gap-2">
              <FieldLabel
                htmlFor="settings-gender"
                className="text-xs font-medium uppercase tracking-wider text-[#6b7280]"
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
          </div>
          <div className="space-y-6">
            <Field className="gap-2">
              <FieldLabel
                htmlFor="settings-alias"
                className="text-xs font-medium uppercase tracking-wider text-[#6b7280]"
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
            <Field className="gap-2">
              <FieldLabel
                htmlFor="settings-dob"
                className="text-xs font-medium uppercase tracking-wider text-[#6b7280]"
              >
                {t("settings.dateOfBirthOptional")}
              </FieldLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="settings-dob"
                    type="button"
                    variant="outline"
                    className={`${inputClassName} justify-start text-left font-normal`}
                  >
                    <HugeiconsIcon icon={Calendar03Icon} size={18} className="mr-2 shrink-0" />
                    {inputs.dateOfBirth ? (
                      format(inputs.dateOfBirth, "dd/MM/yyyy")
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
        </div>
      </form>
    </>
  );
}
