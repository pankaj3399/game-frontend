import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import ScannerIcon from "@/assets/icons/figma/vuesax/bold/scanner.svg?react";
import { Button } from "@/components/ui/button";
import { IconChevronLeft } from "@/icons/figma-icons";
import { getErrorMessage } from "@/lib/errors";
import { useValidateTournamentScoreQr } from "@/pages/tournaments/hooks";

function parseTokenFromRaw(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const asUrl = new URL(trimmed);
      return asUrl.searchParams.get("token")?.trim() ?? "";
    } catch {
      return "";
    }
  }

  return trimmed;
}

export default function ValidateScorePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const tokenFromQuery = searchParams.get("token")?.trim() ?? "";
  const [scannedToken, setScannedToken] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [shouldStartScanner, setShouldStartScanner] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanRafRef = useRef<number | null>(null);
  const lastScanAtRef = useRef(0);
  const hasNavigatedRef = useRef(false);
  const scannerStartInFlightRef = useRef(false);
  const cameraToastShownForAttemptRef = useRef(false);

  const effectiveToken = useMemo(
    () => scannedToken.trim() || tokenFromQuery,
    [scannedToken, tokenFromQuery],
  );

  const validateQuery = useValidateTournamentScoreQr(
    effectiveToken,
    Boolean(effectiveToken),
  );

  const canContinue = Boolean(
    validateQuery.data?.valid === true && validateQuery.data?.request,
  );

  const scanBusy =
    Boolean(effectiveToken) &&
    (validateQuery.isPending || validateQuery.isFetching);

  const showRecoverableFailure =
    Boolean(effectiveToken) &&
    !validateQuery.isPending &&
    !validateQuery.isFetching &&
    (validateQuery.isError ||
      (validateQuery.data != null && validateQuery.data.valid === false));

  const validationFailureMessage = validateQuery.isError
    ? getErrorMessage(validateQuery.error)
    : validateQuery.data?.message ??
      t("recordScorePage.validate.errors.invalidToken");

  const handleRetryValidation = () => {
    setScannedToken("");
    hasNavigatedRef.current = false;
    if (tokenFromQuery) {
      navigate("/record-score/validate", { replace: true });
    }
  };

  const stopScanner = () => {
    if (scanRafRef.current != null) {
      window.cancelAnimationFrame(scanRafRef.current);
      scanRafRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const onGoBack = () => {
    stopScanner();
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/record-score", { replace: true });
  };

  const startScanner = useCallback(async () => {
    if (tokenFromQuery) return;
    if (!videoRef.current) return;
    if (scannerStartInFlightRef.current) return;

    scannerStartInFlightRef.current = true;

    const showNoCameraToast = (message?: string) => {
      if (cameraToastShownForAttemptRef.current) return;
      cameraToastShownForAttemptRef.current = true;
      toast.error(message ?? t("recordScorePage.validate.noCamera", "No camera detected"));
    };

    stopScanner();
    setShouldStartScanner(false);

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof window === "undefined" ||
      !("BarcodeDetector" in window)
    ) {
      setScannerOpen(false);
      showNoCameraToast();
      scannerStartInFlightRef.current = false;
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
    } catch {
      setScannerOpen(false);
      showNoCameraToast();
      scannerStartInFlightRef.current = false;
      return;
    }

    try {
      const DetectorCtor = (
        window as unknown as {
          BarcodeDetector: new (options?: {
            formats?: string[];
          }) => {
            detect: (
              source: HTMLVideoElement,
            ) => Promise<Array<{ rawValue?: string }>>;
          };
        }
      ).BarcodeDetector;
      const detector = new DetectorCtor({ formats: ["qr_code"] });

      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      const scanLoop = async () => {
        if (!videoRef.current || !streamRef.current) return;

        const now = Date.now();
        if (now - lastScanAtRef.current < 250) {
          scanRafRef.current = window.requestAnimationFrame(scanLoop);
          return;
        }
        lastScanAtRef.current = now;

        try {
          const detections = await detector.detect(videoRef.current);
          const payload = detections[0]?.rawValue?.trim() ?? "";
          const token = parseTokenFromRaw(payload);

          if (token) {
            setScannedToken(token);
            stopScanner();
            setScannerOpen(false);
            return;
          }
        } catch {
          // Keep scanning; intermittent detection failures can happen while camera warms up.
        }

        scanRafRef.current = window.requestAnimationFrame(scanLoop);
      };

      scanRafRef.current = window.requestAnimationFrame(scanLoop);
      scannerStartInFlightRef.current = false;
    } catch (error: unknown) {
      stopScanner();
      setScannerOpen(false);
      showNoCameraToast(
        getErrorMessage(error) ??
          t("recordScorePage.validate.noCamera", "No camera detected"),
      );
      scannerStartInFlightRef.current = false;
    }
  }, [t, tokenFromQuery]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  useEffect(() => {
    if (!canContinue || !effectiveToken || hasNavigatedRef.current) return;
    const req = validateQuery.data?.request;
    if (!req) return;

    hasNavigatedRef.current = true;
    const encodedToken = encodeURIComponent(effectiveToken);
    const encodedMatchId = encodeURIComponent(req.matchId);
    const encodedTournamentId = encodeURIComponent(req.tournamentId ?? "");
    stopScanner();
    navigate(
      `/record-score/manual?mode=confirm&token=${encodedToken}&matchId=${encodedMatchId}&tournamentId=${encodedTournamentId}`,
      { replace: true },
    );
  }, [canContinue, effectiveToken, navigate, validateQuery.data?.request]);

  const videoRefCallback = useCallback(
    (node: HTMLVideoElement | null) => {
      videoRef.current = node;
      if (!node || tokenFromQuery) return;
      if (shouldStartScanner) {
        void startScanner();
      }
    },
    [shouldStartScanner, startScanner, tokenFromQuery],
  );

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#dfe2e0] px-4 pb-10 pt-5 sm:px-6 sm:pt-8 lg:min-h-[calc(100vh-60px)] lg:pt-9">
      <div className="mx-auto w-full max-w-[824px]">
        <button
          type="button"
          onClick={onGoBack}
          className="inline-flex items-center gap-1 text-[12px] font-medium text-[#010a04] transition-opacity hover:opacity-65"
        >
          <IconChevronLeft size={14} className="text-[#010a04]" />
          {t("recordScorePage.goBack")}
        </button>

        <section className="mt-2 w-full rounded-[10px] border border-[rgba(1,10,4,0.08)] bg-white px-4 pb-4 pt-3 shadow-[0_3px_7px_rgba(0,0,0,0.06)] sm:px-5 sm:pb-5 sm:pt-4">
          <header className="text-[#010a04]">
            <h1 className="text-2xl font-semibold leading-tight tracking-[-0.01em]">
              {t("recordScorePage.validate.title")}
            </h1>
            <p className="mt-1 max-w-[680px] text-[13px] text-[#010a04]/62">
              {t(
                "recordScorePage.validate.description",
                "Scan opponent's QR code to verify the match result",
              )}
            </p>
          </header>

          <div className="mt-4 space-y-2">
            <Button
              type="button"
              onClick={() => {
                if (tokenFromQuery) return;
                cameraToastShownForAttemptRef.current = false;
                setScannerOpen(true);
                setShouldStartScanner(true);
              }}
              className="h-[34px] w-full rounded-[10px] bg-[#010a04] text-[14px] font-medium text-white hover:bg-black"
              disabled={Boolean(tokenFromQuery) || scanBusy}
            >
              <ScannerIcon className="mr-2 h-4 w-4 shrink-0" />
              {t(
                "recordScorePage.validate.scanButton",
                "Scan Opponent's QR Code",
              )}
            </Button>

            {scanBusy ? (
              <p className="text-center text-[12px] text-[#010a04]/55">
                {t("recordScorePage.validate.validationLoadingHint")}
              </p>
            ) : null}

            {showRecoverableFailure ? (
              <div className="rounded-[10px] border border-[#c45c5c]/35 bg-[#fdf2f2] px-3 py-2 text-[13px] text-[#7f1d1d]">
                <p>{validationFailureMessage}</p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-2 h-[32px] w-full rounded-[8px] border-[#010a04]/20 text-[13px] font-medium"
                  onClick={handleRetryValidation}
                >
                  {t("recordScorePage.validate.retryValidation")}
                </Button>
              </div>
            ) : null}
          </div>

          {scannerOpen ? (
            <div className="mt-3 rounded-[10px] border border-[#010a04]/12 bg-[#f7f8f7] p-2">
              <video
                ref={videoRefCallback}
                autoPlay
                playsInline
                muted
                className="h-[220px] w-full rounded-[8px] bg-black/90 object-cover"
              />
            </div>
          ) : null}

          <div className="mt-3 rounded-[8px] border border-[#1d8ced] bg-[#f3f8ff] px-3 py-2 text-[14px] leading-snug text-[#0f172a]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#1d8ced]">
              {t(
                "recordScorePage.validate.scannedInfoTitle",
                "What gets scanned",
              )}
            </p>
            <p className="mt-1">
              {t(
                "recordScorePage.validate.scannedInfoBody",
                "The QR code contains your opponent's player ID, match score results, and the date the score was recorded. After validation, you'll be redirected to submit and complete the match.",
              )}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
