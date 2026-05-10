import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import ScannerIcon from "@/assets/icons/figma/vuesax/bold/scanner.svg?react";
import { Button } from "@/components/ui/button";
import { IconChevronLeft } from "@/icons/figma-icons";
import { getErrorMessage, getHttpStatus } from "@/lib/errors";
import { useValidateTournamentScoreQrConfirmContext } from "@/pages/tournaments/hooks/useTournamentScoreQr";
import {
  clearScoreQrToken,
  readScoreQrToken,
  storeScoreQrToken,
} from "./scoreQrTokenSession";
import { usePromoteScoreQrTokenFromQuery } from "./hooks/usePromoteScoreQrTokenFromQuery";
import { useScanEnvironment } from "./hooks/useScanEnvironment";

/** Animated loading spinner component */
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center gap-2 py-3">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-2 w-2 rounded-full bg-[#010a04]/60"
            style={{
              animation: `bounce 1.4s infinite ease-in-out`,
              animationDelay: `${i * 0.16}s`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { opacity: 0.4; transform: scale(1); }
          40% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}

export default function ValidateScorePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const tokenFromQuery = searchParams.get("token")?.trim() ?? "";
  const tokenRef = searchParams.get("qrRef")?.trim() ?? "";
  const tokenFromRef = readScoreQrToken(tokenRef);
  const tokenFromNavigationState =
    typeof (location.state as { scoreQrToken?: unknown } | null)?.scoreQrToken ===
    "string"
      ? String((location.state as { scoreQrToken: string }).scoreQrToken).trim()
      : "";
  const hasNavigatedRef = useRef(false);
  const wrongUserToastShownRef = useRef(false);
  const { scanEnvironment } = useScanEnvironment();

  usePromoteScoreQrTokenFromQuery();

  const effectiveToken = useMemo(
    () =>
      tokenFromRef || tokenFromNavigationState || tokenFromQuery,
    [tokenFromNavigationState, tokenFromQuery, tokenFromRef],
  );

  const validateQuery = useValidateTournamentScoreQrConfirmContext(
    effectiveToken,
    Boolean(effectiveToken),
  );

  const confirmForbidden =
    Boolean(effectiveToken) &&
    !validateQuery.isPending &&
    validateQuery.isError &&
    getHttpStatus(validateQuery.error) === 403;

  useEffect(() => {
    if (!confirmForbidden || wrongUserToastShownRef.current) return;
    wrongUserToastShownRef.current = true;
    toast.error(
      t(
        "recordScorePage.validate.errors.linkWrongUser",
        "This QR link is not valid for your account.",
      ),
    );
  }, [confirmForbidden, t]);

  const canContinue = Boolean(
    validateQuery.data?.valid === true && validateQuery.data?.request,
  );

  const scanBusy =
    Boolean(effectiveToken) &&
    (validateQuery.isPending || validateQuery.isFetching);

  const showRecoverableFailure =
    Boolean(effectiveToken) &&
    !confirmForbidden &&
    !validateQuery.isPending &&
    !validateQuery.isFetching &&
    (validateQuery.isError ||
      (validateQuery.data != null && validateQuery.data.valid === false));

  const validationFailureMessage = validateQuery.isError
    ? getErrorMessage(validateQuery.error)
    : validateQuery.data?.message ??
      t("recordScorePage.validate.errors.invalidToken");

  const handleRetryValidation = () => {
    clearScoreQrToken(tokenRef);
    hasNavigatedRef.current = false;
    if (tokenFromQuery || tokenRef || tokenFromNavigationState) {
      navigate("/record-score/validate", { replace: true });
    }
  };

  const onGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/record-score", { replace: true });
  };

  const handleOpenScanner = () => {
    if (tokenFromQuery) return;
    const qs = searchParams.toString();
    navigate(`/record-score/validate/scan${qs ? `?${qs}` : ""}`);
  };

  useEffect(() => {
    if (!canContinue || !effectiveToken || hasNavigatedRef.current) return;
    const req = validateQuery.data?.request;
    if (!req) return;

    hasNavigatedRef.current = true;
    const storedRef = storeScoreQrToken(effectiveToken);
    const encodedMatchId = encodeURIComponent(req.matchId);
    const encodedTournamentId = encodeURIComponent(req.tournamentId ?? "");
    const tokenSearchPart = storedRef
      ? `qrRef=${encodeURIComponent(storedRef)}`
      : "";
    const targetSearch = [
      "mode=confirm",
      tokenSearchPart,
      `matchId=${encodedMatchId}`,
      `tournamentId=${encodedTournamentId}`,
    ]
      .filter(Boolean)
      .join("&");
    navigate(
      `/record-score/manual?${targetSearch}`,
      storedRef
        ? { replace: true }
        : { replace: true, state: { scoreQrToken: effectiveToken } },
    );
  }, [
    canContinue,
    effectiveToken,
    navigate,
    validateQuery.data?.request,
  ]);

  const scanUnavailableMessage = useMemo(() => {
    switch (scanEnvironment) {
      case "noCamera":
        return t(
          "recordScorePage.validate.scanRequiresCamera",
          "QR scanning needs a camera. Use a device with a camera, or open the validation link your opponent shared.",
        );
      case "noMediaApi":
        return t("recordScorePage.validate.cameraApiUnavailable");
      default:
        return "";
    }
  }, [scanEnvironment, t]);

  if (confirmForbidden) {
    return <Navigate to="/record-score" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fafbfa] to-[#f0f2f0] px-4 pb-12 pt-5 sm:px-6 sm:pt-8 lg:pt-10">
      <div className="mx-auto w-full max-w-[700px]">
        {/* Back Button */}
        <button
          type="button"
          onClick={onGoBack}
          className="group inline-flex items-center gap-1.5 text-sm font-medium text-[#010a04]/70 transition-all hover:text-[#010a04] hover:gap-2"
        >
          <IconChevronLeft size={16} className="text-[#010a04]/60 transition-colors group-hover:text-[#010a04]" />
          {t("recordScorePage.goBack")}
        </button>

        {/* Main Card */}
        <section className="mt-6 w-full overflow-hidden rounded-[16px] border border-[rgba(1,10,4,0.06)] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all duration-300">
          {/* Header Section */}
          <div className="border-b border-[rgba(1,10,4,0.04)] bg-gradient-to-r from-white to-[#f9faf9] px-5 py-6 sm:px-6 sm:py-7">
            <h1 className="text-3xl font-bold tracking-tight text-[#010a04]">
              {t("recordScorePage.validate.title")}
            </h1>
            <p className="mt-2 text-[14px] leading-relaxed text-[#010a04]/65">
              {t(
                "recordScorePage.validate.description",
                "Scan opponent's QR code to verify the match result",
              )}
            </p>
          </div>

          {/* Content Section */}
          <div className="space-y-3 px-5 py-5 sm:px-6 sm:py-6">
            {/* Scan: requires camera + mediaDevices (BarcodeDetector or jsQR fallback on scan route) */}
            {scanEnvironment === "checking" ? (
              <Button
                type="button"
                disabled
                className="h-[44px] w-full cursor-wait rounded-[12px] bg-[#010a04]/85 text-[15px] font-semibold text-white opacity-70"
              >
                {t("recordScorePage.validate.checkingCamera", "Checking camera…")}
              </Button>
            ) : scanEnvironment === "ready" ? (
              <Button
                type="button"
                onClick={handleOpenScanner}
                disabled={Boolean(tokenFromQuery) || scanBusy}
                className={`group h-[44px] w-full rounded-[12px] text-[15px] font-semibold transition-all duration-200 ${
                  scanBusy
                    ? "bg-[#010a04] text-white shadow-md"
                    : "bg-[#010a04] text-white hover:bg-black hover:shadow-lg active:scale-95"
                }`}
              >
                <ScannerIcon className="mr-2 h-5 w-5 shrink-0 transition-transform group-hover:scale-110" />
                {scanBusy
                  ? t(
                      "recordScorePage.validate.validationLoadingHint",
                      "Validating QR token...",
                    )
                  : t(
                      "recordScorePage.validate.scanButton",
                      "Scan Opponent's QR Code",
                    )}
              </Button>
            ) : (
              <div className="space-y-3">
                <Button
                  type="button"
                  disabled
                  className="h-[44px] w-full cursor-not-allowed rounded-[12px] bg-[#010a04]/85 text-[15px] font-semibold text-white opacity-50"
                >
                  <ScannerIcon className="mr-2 h-5 w-5 shrink-0 opacity-90" />
                  {t(
                    "recordScorePage.validate.scanButton",
                    "Scan Opponent's QR Code",
                  )}
                </Button>
                <div className="rounded-[12px] border border-[rgba(1,10,4,0.08)] bg-[#f0f3f2] px-4 py-3 text-[13px] leading-relaxed text-[#010a04]/80">
                  <p>{scanUnavailableMessage}</p>
                  <p className="mt-2 text-[#010a04]/70">
                    {t(
                      "recordScorePage.validate.useValidationLinkInstead",
                      "You can open the validation link your opponent shared instead of scanning.",
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Loading State with Animation */}
            {scanBusy && (
              <div className="rounded-[12px] bg-[#f0f3f2] px-4 py-3 text-center">
                <LoadingSpinner />
              </div>
            )}

            {/* Error State */}
            {showRecoverableFailure && (
              <div className="animate-in fade-in slide-in-from-top-2 rounded-[12px] border border-[#f87171]/30 bg-[#fef2f2] px-4 py-3 transition-all duration-300">
                <div className="flex gap-2">
                  <div className="flex-shrink-0 pt-0.5">
                    <svg className="h-5 w-5 text-[#dc2626]" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#991b1b]">
                      {validationFailureMessage}
                    </p>
                    <Button
                      type="button"
                      onClick={handleRetryValidation}
                      className="mt-3 h-[36px] w-full rounded-[10px] border-[#010a04]/20 bg-white text-sm font-medium text-[#010a04] transition-all hover:bg-[#f5f5f5] active:scale-95"
                      variant="outline"
                    >
                      {t("recordScorePage.validate.retryValidation")}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="border-t border-[rgba(1,10,4,0.04)] bg-[#f9faf9] px-5 py-4 sm:px-6 sm:py-5">
            <div className="flex gap-3">
              <div className="flex-shrink-0 pt-0.5">
                <svg className="h-5 w-5 text-[#010a04]/50" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#010a04]/50">
                  {t("recordScorePage.validate.scannedInfoTitle", "What gets scanned")}
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-[#010a04]/65">
                  {t(
                    "recordScorePage.validate.scannedInfoBody",
                    "The QR code contains your opponent's player ID, match score results, and the date the score was recorded. After validation, you'll be redirected to submit and complete the match.",
                  )}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
