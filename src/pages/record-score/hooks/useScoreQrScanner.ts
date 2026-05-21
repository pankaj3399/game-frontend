import type { IDetectedBarcode, IScannerProps } from "@yudiel/react-qr-scanner";
import type { TFunction } from "i18next";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";
import { playScoreQrScanSound } from "@/lib/scoreQrScanSound";
import { parseScoreQrTokenFromPayload } from "../scoreQrCameraScan";

type UseScoreQrScannerOptions = {
  /** When true, camera scanning is paused (e.g. token already supplied via URL). */
  scanBlocked: boolean;
  /** Start scanning as soon as the scanner component is mounted. */
  autoStart: boolean;
  onTokenDetected: (token: string) => void;
};

function getCameraErrorMessage(error: unknown, t: TFunction) {
  const name = error instanceof Error ? error.name : "";
  if (name === "NotAllowedError") {
    return t("recordScorePage.validate.cameraPermissionDenied");
  }
  if (name === "NotFoundError") {
    return t("recordScorePage.validate.cameraNotFound");
  }
  if (name === "NotReadableError") {
    return t("recordScorePage.validate.cameraInUse");
  }
  return (
    getErrorMessage(error) ||
    t("recordScorePage.validate.noCamera")
  ).trim();
}

export function useScoreQrScanner({
  scanBlocked,
  autoStart,
  onTokenDetected,
}: UseScoreQrScannerOptions) {
  const { t } = useTranslation();
  const detectedRef = useRef(false);
  const cameraToastShownRef = useRef(false);
  const [hasDetectedToken, setHasDetectedToken] = useState(false);

  useEffect(() => {
    if (!scanBlocked) {
      detectedRef.current = false;
      cameraToastShownRef.current = false;
      setHasDetectedToken(false);
    }
  }, [scanBlocked]);

  const onScan = useCallback(
    (detectedCodes: IDetectedBarcode[]) => {
      if (detectedRef.current || scanBlocked) return;

      const detectedToken =
        detectedCodes
          .map((code) => parseScoreQrTokenFromPayload(code.rawValue))
          .find(Boolean) ?? "";

      if (!detectedToken) return;

      playScoreQrScanSound();
      detectedRef.current = true;
      setHasDetectedToken(true);
      onTokenDetected(detectedToken);
    },
    [onTokenDetected, scanBlocked],
  );

  const onError = useCallback(
    (error: unknown) => {
      if (cameraToastShownRef.current || scanBlocked) return;
      cameraToastShownRef.current = true;
      const message = getCameraErrorMessage(error, t);
      toast.error(message || t("recordScorePage.validate.noCamera"));
    },
    [scanBlocked, t],
  );

  const scannerProps = useMemo<IScannerProps>(
    () => ({
      onScan,
      onError,
      paused: scanBlocked || !autoStart || hasDetectedToken,
      constraints: {
        facingMode: "environment",
      },
      formats: ["qr_code"],
      scanDelay: 0,
      allowMultiple: false,
      sound: false,
      components: {
        finder: false,
        torch: true,
      },
      styles: {
        container: {
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          aspectRatio: "auto",
          backgroundColor: "black",
        },
        video: {
          width: "100%",
          height: "100%",
          objectFit: "cover",
        },
      },
    }),
    [autoStart, hasDetectedToken, onError, onScan, scanBlocked],
  );

  return {
    scannerProps,
  };
}
