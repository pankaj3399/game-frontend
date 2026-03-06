import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { FcGoogle } from "react-icons/fc";
import { SiApple } from "react-icons/si";
import { getBackendUrl } from "@/lib/api";

function decodeApplePayload(base64: string | null): Record<string, unknown> | null {
  if (!base64 || typeof base64 !== "string") return null;
  try {
    let b64 = base64.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4;
    if (pad) b64 += "=".repeat(4 - pad);
    const json = atob(b64);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

const Login = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const errorMessage = searchParams.get("errorMessage");
  const applePayload = decodeApplePayload(searchParams.get("applePayload"));
  const backendUrl = getBackendUrl();
  const googleAuthUrl = backendUrl ? new URL("/api/auth/google", backendUrl).toString() : null;
  const appleAuthUrl = backendUrl ? new URL("/api/auth/apple", backendUrl).toString() : null;

  return (
    <section className="relative w-full min-h-screen flex flex-col items-center justify-center gap-6 py-8 px-4 sm:px-6">
      <div className="w-full max-w-[580px] rounded-lg border border-tableBorder px-6 py-10 shadow-table md:px-6 md:py-6 lg:px-14 lg:py-8 flex flex-col">
        <h1 className="text-center font-primary text-[22px] font-bold capitalize text-brand-primary md:text-[26px]">
          {t("common.login")}
        </h1>
        {(errorMessage || applePayload) && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {errorMessage && <p className="font-medium">{errorMessage}</p>}
            {applePayload && Object.keys(applePayload).length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer font-medium">Apple payload (debug)</summary>
                <pre className="mt-2 overflow-auto rounded bg-muted/50 p-2 text-xs">
                  {JSON.stringify(applePayload, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}
        {googleAuthUrl ? (
          <a
            href={googleAuthUrl}
            className="font-semibold border rounded-lg border-[#C6C4D5] active:animate-jerk text-[#333333] bg-white w-full mt-6 md:h-[48px] h-[40px] font-primary md:text-base text-sm hover:bg-white flex justify-center items-center gap-2 no-underline"
          >
            <FcGoogle size={22} className="mr-2 shrink-0" />
            {t("auth.signInWithGoogle")}
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="font-semibold border rounded-lg border-[#C6C4D5] text-[#333333] bg-white w-full mt-6 md:h-[48px] h-[40px] font-primary md:text-base text-sm flex justify-center items-center gap-2 opacity-50 cursor-not-allowed"
          >
            <FcGoogle size={22} className="mr-2 shrink-0" />
            {t("auth.signInWithGoogle")}
          </button>
        )}
        {appleAuthUrl ? (
          <a
            href={appleAuthUrl}
            className="font-semibold border rounded-lg border-[#C6C4D5] active:animate-jerk text-[#333333] bg-white w-full mt-4 md:h-[48px] h-[40px] font-primary md:text-base text-sm hover:bg-white flex justify-center items-center gap-2 no-underline"
          >
            <SiApple size={22} className="mr-2 shrink-0 text-[#000000]" />
            {t("auth.signInWithApple")}
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="font-semibold border rounded-lg border-[#C6C4D5] text-[#333333] bg-white w-full mt-4 md:h-[48px] h-[40px] font-primary md:text-base text-sm flex justify-center items-center gap-2 opacity-50 cursor-not-allowed"
          >
            <SiApple size={22} className="mr-2 shrink-0 text-[#000000]" />
            {t("auth.signInWithApple")}
          </button>
        )}
        <button
          type="button"
          className="font-semibold rounded-lg bg-brand-primary text-white mt-8 md:h-[48px] h-[40px] font-primary md:text-base text-sm flex justify-center items-center gap-2 self-center px-8 hover:bg-brand-primary-hover active:animate-jerk"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={22} className="mr-2" />
          {t("auth.backToHome")}
        </button>
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
          <ul className="list-disc list-inside text-sm">
            <li>
              <a
                href="https://support.apple.com/en-us/102571"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-primary underline hover:underline"
              >
                https://support.apple.com/en-us/102571
              </a>
            </li>
            <li>
              <a
                href="https://www.google.com/account/about/sign-in-with-google/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-primary underline hover:underline"
              >
                https://www.google.com/account/about/sign-in-with-google/
              </a>
            </li>
          </ul>
        </div>

        <div className="border-l-4 border-brand-primary pl-4 space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <SiApple size={16} className="shrink-0 text-[#000000]" />
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
              <FcGoogle size={16} className="shrink-0" />
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
