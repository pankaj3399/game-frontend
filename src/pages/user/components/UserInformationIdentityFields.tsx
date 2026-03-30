import { useTranslation } from "react-i18next";
import type { ChangeEvent } from "react";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { UserIcon } from "@/icons/figma-icons";
import { USER_INFORMATION_INPUT_CLASSNAME } from "@/pages/user/constants";

interface UserInformationIdentityFieldsProps {
  alias: string;
  name: string;
  aliasError?: string;
  nameError?: string;
  onInputChange: (e: ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void;
}

export function UserInformationIdentityFields({
  alias,
  name,
  aliasError,
  nameError,
  onInputChange,
}: UserInformationIdentityFieldsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <Field className="gap-2">
        <FieldLabel
          htmlFor="signup-alias"
          className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[#6b7280]"
        >
          <UserIcon size={14} className="text-muted-foreground" />
          {t("signup.alias")} <span className="text-destructive">*</span>
        </FieldLabel>
        <Input
          id="signup-alias"
          required
          type="text"
          name="alias"
          autoComplete="username"
          spellCheck={false}
          className={USER_INFORMATION_INPUT_CLASSNAME}
          placeholder={t("signup.enterAlias")}
          value={alias}
          onChange={onInputChange}
          aria-invalid={!!aliasError}
          aria-describedby={aliasError ? "signup-alias-error" : undefined}
        />
        {aliasError ? (
          <p id="signup-alias-error" className="text-sm text-destructive" aria-live="polite">
            {aliasError}
          </p>
        ) : null}
      </Field>

      <Field className="gap-2">
        <FieldLabel
          htmlFor="signup-name"
          className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[#6b7280]"
        >
          <UserIcon size={14} className="text-muted-foreground" />
          {t("signup.name")} <span className="text-destructive">*</span>
        </FieldLabel>
        <Input
          id="signup-name"
          required
          type="text"
          name="name"
          autoComplete="name"
          className={USER_INFORMATION_INPUT_CLASSNAME}
          placeholder={t("signup.enterName")}
          value={name}
          onChange={onInputChange}
          aria-invalid={!!nameError}
          aria-describedby={nameError ? "signup-name-error" : undefined}
        />
        {nameError ? (
          <p id="signup-name-error" className="text-sm text-destructive" aria-live="polite">
            {nameError}
          </p>
        ) : null}
      </Field>
    </div>
  );
}
