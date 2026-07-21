import { Trans, useTranslation } from "react-i18next";
import { GLOBAL_PARAMETERS } from "@/constants/constants";

interface UserInformationTermsFieldProps {
  accepted: boolean;
  error?: string;
  onAcceptedChange: (accepted: boolean) => void;
}

export function UserInformationTermsField({
  accepted,
  error,
  onAcceptedChange,
}: UserInformationTermsFieldProps) {
  const { t } = useTranslation();
  const termsHref = GLOBAL_PARAMETERS.USER_TERMS_URL || "/about#user-terms";
  const opensExternal = Boolean(GLOBAL_PARAMETERS.USER_TERMS_URL);

  return (
    <div className="space-y-1.5">
      <label className="flex items-start gap-2.5 text-sm text-[#010a04]/85">
        <input
          type="checkbox"
          name="acceptedTerms"
          checked={accepted}
          onChange={(e) => onAcceptedChange(e.target.checked)}
          className="mt-0.5 size-4 shrink-0 rounded border-[#d9dee3] accent-[#067429]"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "signup-terms-error" : undefined}
        />
        <span>
          <Trans
            i18nKey="signup.acceptTerms"
            components={{
              termsLink: (
                <a
                  href={termsHref}
                  target={opensExternal ? "_blank" : undefined}
                  rel={opensExternal ? "noopener noreferrer" : undefined}
                  className="font-medium text-[#067429] underline underline-offset-2"
                  onClick={(e) => e.stopPropagation()}
                />
              ),
            }}
          />
        </span>
      </label>
      {error ? (
        <p id="signup-terms-error" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {!GLOBAL_PARAMETERS.USER_TERMS_URL ? (
        <p className="pl-[26px] text-xs text-[#010a04]/55">{t("signup.termsComingSoon")}</p>
      ) : null}
    </div>
  );
}
