import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Trans } from "react-i18next";
import { GLOBAL_PARAMETERS } from "@/constants/constants";
import { IconExternalLink, ShieldIcon } from "@/icons/figma-icons";
import { cn } from "@/lib/utils";

interface UserInformationTermsFieldProps {
  accepted: boolean;
  error?: string;
  onAcceptedChange: (accepted: boolean) => void;
}

function TermsLink({
  opensExternal,
  children,
  ...props
}: ComponentPropsWithoutRef<"a"> & {
  opensExternal: boolean;
  children?: ReactNode;
}) {
  return (
    <a
      {...props}
      className="inline-flex items-center gap-1 font-medium text-[#067429] underline decoration-[#067429]/35 underline-offset-[3px] transition-colors hover:text-[#055f22] hover:decoration-[#055f22]/60"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
      {opensExternal ? (
        <IconExternalLink
          size={12}
          className="text-[#067429]/70"
          aria-hidden
        />
      ) : null}
    </a>
  );
}

export function UserInformationTermsField({
  accepted,
  error,
  onAcceptedChange,
}: UserInformationTermsFieldProps) {
  const termsHref = GLOBAL_PARAMETERS.USER_TERMS_URL || "/about#user-terms";
  const opensExternal = Boolean(GLOBAL_PARAMETERS.USER_TERMS_URL);
  const hasError = Boolean(error);

  return (
    <div
      className={cn(
        "rounded-xl border px-3.5 py-3.5 transition-colors sm:px-4",
        hasError
          ? "border-destructive/35 bg-destructive/[0.04]"
          : accepted
            ? "border-[#067429]/30 bg-[#067429]/[0.05]"
            : "border-[#010a04]/10 bg-[#f9faf9]",
      )}
    >
      <label
        htmlFor="signup-accepted-terms"
        className="flex cursor-pointer gap-3"
      >
        <span className="relative mt-0.5 flex size-5 shrink-0">
          <input
            id="signup-accepted-terms"
            type="checkbox"
            name="acceptedTerms"
            checked={accepted}
            onChange={(e) => onAcceptedChange(e.target.checked)}
            className="peer absolute inset-0 z-10 size-full cursor-pointer opacity-0"
            aria-invalid={hasError}
            aria-describedby={hasError ? "signup-terms-error" : undefined}
          />
          <span
            aria-hidden
            className={cn(
              "pointer-events-none flex size-5 items-center justify-center rounded-md border-2 transition-colors",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-[#067429]/35 peer-focus-visible:ring-offset-2",
              accepted
                ? "border-[#067429] bg-[#067429] text-white"
                : hasError
                  ? "border-destructive/60 bg-white"
                  : "border-[#010a04]/20 bg-white",
            )}
          >
            <svg
              viewBox="0 0 12 12"
              className={cn(
                "size-3 transition-opacity",
                accepted ? "opacity-100" : "opacity-0",
              )}
              fill="none"
              aria-hidden
            >
              <path
                d="M2.5 6.2 4.8 8.5 9.5 3.5"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </span>

        <span className="min-w-0 flex-1 space-y-2">
          <span className="flex items-start gap-2">
            <ShieldIcon
              size={14}
              className={cn(
                "mt-0.5 shrink-0",
                accepted ? "text-[#067429]" : "text-[#010a04]/45",
              )}
            />
            <span className="text-sm leading-snug text-[#010a04]/88">
              <Trans
                i18nKey="signup.acceptTerms"
                components={{
                  termsLink: (
                    <TermsLink
                      href={termsHref}
                      opensExternal={opensExternal}
                      target={opensExternal ? "_blank" : undefined}
                      rel={opensExternal ? "noopener noreferrer" : undefined}
                    />
                  ),
                }}
              />
            </span>
          </span>

          {hasError ? (
            <span
              id="signup-terms-error"
              className="block text-sm leading-snug text-destructive"
              role="alert"
            >
              {error}
            </span>
          ) : null}
        </span>
      </label>
    </div>
  );
}
