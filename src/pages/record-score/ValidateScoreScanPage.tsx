import { Scanner } from "@yudiel/react-qr-scanner";
import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import ScannerIcon from "@/assets/icons/figma/vuesax/bold/scanner.svg?react";
import { IconChevronLeft } from "@/icons/figma-icons";
import { usePromoteScoreQrTokenFromQuery } from "./hooks/usePromoteScoreQrTokenFromQuery";
import { useScanEnvironment } from "./hooks/useScanEnvironment";
import {
  preloadScoreQrScanSound,
  unlockScoreQrScanSound,
} from "@/lib/scoreQrScanSound";
import { useScoreQrScanner } from "./hooks/useScoreQrScanner";
import { storeScoreQrToken } from "./scoreQrTokenSession";

function ScanPageSpinner() {
  const { t } = useTranslation();
  return (
    <div role="status" aria-live="polite" className="flex items-center justify-center gap-2 py-8">
      <span className="sr-only">{t("common.loading", "Loading...")}</span>
      <div className="flex gap-1" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-2 w-2 rounded-full bg-white/60"
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

export default function ValidateScoreScanPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenFromQuery = searchParams.get("token")?.trim() ?? "";

  usePromoteScoreQrTokenFromQuery();

  const onTokenDetected = useCallback(
    (token: string) => {
      const storedRef = storeScoreQrToken(token);
      if (storedRef) {
        navigate(`/record-score/validate?qrRef=${encodeURIComponent(storedRef)}`, {
          replace: true,
        });
        return;
      }
      navigate("/record-score/validate", {
        replace: true,
        state: { scoreQrToken: token },
      });
    },
    [navigate],
  );

  const { scanEnvironment } = useScanEnvironment();

  const { scannerProps } = useScoreQrScanner({
    scanBlocked: Boolean(tokenFromQuery),
    autoStart: true,
    onTokenDetected,
  });

  useEffect(() => {
    preloadScoreQrScanSound();
  }, []);

  const onBack = () => {
    unlockScoreQrScanSound();
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/record-score", { replace: true });
  };

  const unlockScanAudio = () => {
    unlockScoreQrScanSound();
  };

  const backLabel = t(
    "recordScorePage.validate.scanPageBack",
    "Back to validate score",
  );

  const scanUnavailableMessage =
    scanEnvironment === "noCamera"
      ? t(
          "recordScorePage.validate.scanRequiresCamera",
          "QR scanning needs a camera. Use a device with a camera, or open the validation link your opponent shared.",
        )
      : scanEnvironment === "noMediaApi"
        ? t("recordScorePage.validate.cameraApiUnavailable")
        : "";

  const backButton = (
    <button
      type="button"
      onClick={onBack}
      aria-label={backLabel}
      className="absolute left-3 top-[max(0.75rem,env(safe-area-inset-top))] z-20 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white/95 backdrop-blur-sm transition-colors hover:bg-black/60 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary/80"
    >
      <IconChevronLeft size={22} className="shrink-0" aria-hidden />
    </button>
  );

  const pageShellClass =
    "relative flex min-h-0 flex-1 flex-col bg-black";

  if (tokenFromQuery) {
    return (
      <div className={pageShellClass}>
        {backButton}
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <ScanPageSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className={pageShellClass}>
      {backButton}
      {scanEnvironment === "checking" ? (
        <div className="flex min-h-0 flex-1 items-center justify-center bg-[#0f1210]">
          <ScanPageSpinner />
        </div>
      ) : scanEnvironment === "ready" ? (
        <div
          className="relative min-h-0 flex-1 overflow-hidden"
          onPointerDown={unlockScanAudio}
        >
          <Scanner {...scannerProps} />
          <div
            className="pointer-events-none absolute inset-0 z-10 flex items-start justify-center pt-[min(22vh,10rem)]"
            aria-hidden
          >
            <div className="aspect-square w-[min(72vmin,20rem)] rounded-lg border-2 border-brand-primary/50 shadow-[0_0_24px_color-mix(in_srgb,var(--brand-primary)_40%,transparent)]" />
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6 pb-8 pt-14 text-center">
          <ScannerIcon className="h-10 w-10 text-white/35" aria-hidden />
          <p className="max-w-sm text-sm leading-relaxed text-white/75">
            {scanUnavailableMessage}
          </p>
          <p className="max-w-sm text-[13px] leading-relaxed text-white/50">
            {t(
              "recordScorePage.validate.useValidationLinkInstead",
              "You can open the validation link your opponent shared instead of scanning.",
            )}
          </p>
        </div>
      )}
    </div>
  );
}
