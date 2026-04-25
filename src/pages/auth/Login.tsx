import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft01Icon } from "@/icons/figma-icons";
import Google from "@/assets/icons/Google";
import Apple from "@/assets/icons/Apple";
import { getBackendUrl } from "@/lib/api";
import InlineLoader from "@/components/shared/InlineLoader";

type SocialProvider = "google" | "apple";

interface SocialButtonProps {
  providerKey: SocialProvider;
  authUrl: string | null;
  Icon: typeof Google;
  label: string;
  loading: boolean;
  isSubmitting: boolean;
  isOAuthAvailable: boolean;
  socialButtonClassName: string;
  onSignIn: (provider: SocialProvider, url: string | null) => void;
  loadingLabel: string;
  unavailableDescriptionId: string;
}

function SocialButton({
  providerKey,
  authUrl,
  Icon,
  label,
  loading,
  isSubmitting,
  isOAuthAvailable,
  socialButtonClassName,
  onSignIn,
  loadingLabel,
  unavailableDescriptionId,
}: SocialButtonProps) {
  const isDisabled = !authUrl || isSubmitting;
  return (
    <button
      type="button"
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={loading}
      aria-label={label}
      aria-describedby={!isOAuthAvailable ? unavailableDescriptionId : undefined}
      onClick={() => onSignIn(providerKey, authUrl)}
      className={socialButtonClassName}
    >
      {loading ? (
        <InlineLoader size="sm" className="border-[#C6C4D5] border-t-brand-primary" />
      ) : (
        <Icon
          width={22}
          height={22}
          className={
            providerKey === "apple" ? "mr-2 shrink-0 text-[#000000]" : "mr-2 shrink-0"
          }
        />
      )}
      {label}
      {loading ? <span className="sr-only"> {loadingLabel}</span> : null}
    </button>
  );
}

const Login = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [submittingProvider, setSubmittingProvider] = useState<"google" | "apple" | null>(null);
  const error = searchParams.get("error");
  const errorMessage = searchParams.get("errorMessage");
  const backendUrl = getBackendUrl();
  const googleAuthUrl = backendUrl ? new URL("/api/auth/google", backendUrl).toString() : null;
  const appleAuthUrl = backendUrl ? new URL("/api/auth/apple", backendUrl).toString() : null;
  const isOAuthAvailable = Boolean(googleAuthUrl || appleAuthUrl);
  const oauthUnavailableDescriptionId = "auth-oauth-unavailable-description";
  const isSubmitting = submittingProvider !== null;

  const handleProviderSignIn = (provider: "google" | "apple", authUrl: string | null) => {
    if (!authUrl || isSubmitting) {
      return;
    }

    setSubmittingProvider(provider);
    try {
      window.location.assign(authUrl);
    } catch {
      setSubmittingProvider(null);
    }
  };

  const socialButtonClassName =
    "font-semibold border rounded-lg border-[#C6C4D5] text-[#333333] bg-white w-full md:h-[48px] h-[40px] font-primary md:text-base text-sm flex justify-center items-center gap-2 transition-colors transition-transform duration-150 hover:bg-[#F7F7FA] active:bg-[#ECEBF3] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:border-brand-primary disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-white disabled:active:scale-100";

  return (
    <section className="relative w-full min-h-screen flex flex-col items-center justify-center gap-6 py-8 px-4 sm:px-6">
      <div className="w-full max-w-[580px] rounded-lg border border-tableBorder px-6 py-10 shadow-table md:px-6 md:py-6 lg:px-14 lg:py-8 flex flex-col">
        <h1 className="text-center font-primary text-[22px] font-bold capitalize text-brand-primary md:text-[26px]">
          {t("common.login")}
        </h1>
        {error || errorMessage ? (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            {errorMessage ?? "Sign-in could not be completed. Please try again."}
          </div>
        ) : null}
        {!isOAuthAvailable ? (
          <p
            id={oauthUnavailableDescriptionId}
            role="status"
            className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          >
            {t("auth.oauthUnavailable")}
          </p>
        ) : null}
        <SocialButton
          providerKey="google"
          authUrl={googleAuthUrl}
          Icon={Google}
          label={t("auth.signInWithGoogle")}
          loading={submittingProvider === "google"}
          isSubmitting={isSubmitting}
          isOAuthAvailable={isOAuthAvailable}
          socialButtonClassName={`${socialButtonClassName} mt-6`}
          onSignIn={handleProviderSignIn}
          loadingLabel={t("common.loading")}
          unavailableDescriptionId={oauthUnavailableDescriptionId}
        />
        <SocialButton
          providerKey="apple"
          authUrl={appleAuthUrl}
          Icon={Apple}
          label={t("auth.signInWithApple")}
          loading={submittingProvider === "apple"}
          isSubmitting={isSubmitting}
          isOAuthAvailable={isOAuthAvailable}
          socialButtonClassName={`${socialButtonClassName} mt-4`}
          onSignIn={handleProviderSignIn}
          loadingLabel={t("common.loading")}
          unavailableDescriptionId={oauthUnavailableDescriptionId}
        />
        <Link
          to="/"
          className="font-semibold rounded-lg bg-brand-primary text-white mt-8 md:h-[48px] h-[40px] font-primary md:text-base text-sm flex justify-center items-center gap-2 self-center px-8 hover:bg-brand-primary-hover active:animate-jerk"
        >
          <ArrowLeft01Icon size={22} className="mr-2" />
          {t("auth.backToHome")}
        </Link>
      </div>

      <div className="w-full max-w-[580px] p-6 space-y-6 rounded-lg border border-tableBorder shadow-table">
        <div>
          <h2 className="font-semibold text-base text-[#333333]">
            {t("auth.whatDoesSignInMean")}
          </h2>
          <p className="mt-2 text-sm text-[#333333]">
            {t("auth.signInExplanation")}
          </p>
          <p className="mt-2 text-sm font-semibold text-[#333333]">
            {t("auth.forMoreInfo")}
          </p>
      
        </div>

        <div className="border-l-4 border-brand-primary pl-4 space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <Apple width={16} height={16} className="shrink-0 text-[#000000]" />
              <h3 className="font-semibold text-[#333333]">{t("auth.appleSupport")}</h3>
            </div>
            <a
              href="https://support.apple.com/en-us/102571"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-primary text-sm underline hover:underline block mt-1"
            >
              {t("auth.appleSupportLink")}
            </a>
            <p className="text-sm text-[#333333] mt-1">
              {t("auth.appleSupportDescription")}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <Google width={16} height={16} className="shrink-0" />
              <h3 className="font-semibold text-[#333333]">{t("auth.signInWithGoogleTitle")}</h3>
            </div>
            <a
              href="https://www.google.com/account/about/sign-in-with-google/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-primary text-sm underline hover:underline block mt-1"
            >
              {t("auth.googleAccountLink")}
            </a>
            <p className="text-sm text-[#333333] mt-1">
              {t("auth.googleAccountDescription")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Login;
