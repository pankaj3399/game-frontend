import { useTranslation } from "react-i18next";
import type { ChangeEvent } from "react";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { HugeiconsIcon } from "@hugeicons/react";
import { Mail01Icon } from "@hugeicons/core-free-icons";
import { USER_INFORMATION_INPUT_CLASSNAME } from "@/pages/user/constants";

interface UserInformationEmailFieldProps {
  requiresEmailInput: boolean;
  displayEmail: string;
  email: string;
  emailError?: string;
  onInputChange: (e: ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void;
}

export function UserInformationEmailField({
  requiresEmailInput,
  displayEmail,
  email,
  emailError,
  onInputChange,
}: UserInformationEmailFieldProps) {
  const { t } = useTranslation();

  return (
    <Field className="gap-2">
      <FieldLabel
        htmlFor="signup-email"
        className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[#6b7280]"
      >
        <HugeiconsIcon icon={Mail01Icon} size={14} />
        {t("signup.emailAddress")} <span className="text-destructive">*</span>
      </FieldLabel>
      <Input
        id="signup-email"
        type="email"
        required={requiresEmailInput}
        name="email"
        className={USER_INFORMATION_INPUT_CLASSNAME}
        value={requiresEmailInput ? email : displayEmail}
        onChange={requiresEmailInput ? onInputChange : undefined}
        readOnly={!requiresEmailInput}
        disabled={!requiresEmailInput}
        aria-readonly={!requiresEmailInput}
        aria-invalid={!!emailError}
        aria-describedby={emailError ? "signup-email-error" : undefined}
      />
      {requiresEmailInput ? (
        <p className="text-sm text-muted-foreground">
          Apple did not provide a usable email address. Enter the email you want to use
          for this account.
        </p>
      ) : null}
      {emailError ? (
        <p id="signup-email-error" className="text-sm text-destructive" aria-live="polite">
          {emailError}
        </p>
      ) : null}
    </Field>
  );
}
