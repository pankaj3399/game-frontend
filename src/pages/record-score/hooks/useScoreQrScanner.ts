import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";
import {
  captureVideoFrameImageData,
  decodeScoreQrWithJsQR,
  parseScoreQrTokenFromPayload,
} from "../scoreQrCameraScan";

type UseScoreQrScannerOptions = {
  /** When true, camera stream will not start (e.g. token already supplied via URL). */
  scanBlocked: boolean;
  /** Start scanning as soon as the video element is mounted. */
  autoStart: boolean;
  onTokenDetected: (token: string) => void;
};

export function useScoreQrScanner({
  scanBlocked,
  autoStart,
  onTokenDetected,
}: UseScoreQrScannerOptions) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanRafRef = useRef<number | null>(null);
  const lastScanAtRef = useRef(0);
  const scannerStartInFlightRef = useRef(false);
  const cameraToastShownForAttemptRef = useRef(false);
  const autoStartRequestedRef = useRef(false);

  const stopScanner = useCallback(() => {
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
  }, []);

  const startScanner = useCallback(async () => {
    if (scanBlocked) return;
    if (!videoRef.current) return;
    if (scannerStartInFlightRef.current) return;

    scannerStartInFlightRef.current = true;

    const showScanAttemptError = (message: string) => {
      if (cameraToastShownForAttemptRef.current) return;
      cameraToastShownForAttemptRef.current = true;
      toast.error(message);
    };

    stopScanner();

    if (typeof navigator === "undefined" || typeof window === "undefined") {
      scannerStartInFlightRef.current = false;
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      showScanAttemptError(
        t("recordScorePage.validate.cameraApiUnavailable"),
      );
      scannerStartInFlightRef.current = false;
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
    } catch (error: unknown) {
      const name = error instanceof Error ? error.name : "";
      let message: string;
      if (name === "NotAllowedError") {
        message = t("recordScorePage.validate.cameraPermissionDenied");
      } else if (name === "NotFoundError") {
        message = t("recordScorePage.validate.cameraNotFound");
      } else if (name === "NotReadableError") {
        message = t("recordScorePage.validate.cameraInUse");
      } else {
        message =
          getErrorMessage(error) ?? t("recordScorePage.validate.noCamera");
      }
      showScanAttemptError(message);
      scannerStartInFlightRef.current = false;
      return;
    }

    try {
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      const useNativeBarcode = "BarcodeDetector" in window;

      if (useNativeBarcode) {
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
            const token = parseScoreQrTokenFromPayload(payload);

            if (token) {
              onTokenDetected(token);
              stopScanner();
              return;
            }
          } catch {
            // Keep scanning; intermittent detection failures can happen while camera warms up.
          }

          scanRafRef.current = window.requestAnimationFrame(scanLoop);
        };

        scanRafRef.current = window.requestAnimationFrame(scanLoop);
      } else {
        const canvas = document.createElement("canvas");

        const scanLoop = () => {
          if (!videoRef.current || !streamRef.current) return;
          const video = videoRef.current;

          if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
            scanRafRef.current = window.requestAnimationFrame(scanLoop);
            return;
          }

          const now = Date.now();
          if (now - lastScanAtRef.current < 250) {
            scanRafRef.current = window.requestAnimationFrame(scanLoop);
            return;
          }
          lastScanAtRef.current = now;

          const imageData = captureVideoFrameImageData(video, canvas);
          if (imageData) {
            const token = decodeScoreQrWithJsQR(imageData);
            if (token) {
              onTokenDetected(token);
              stopScanner();
              return;
            }
          }

          scanRafRef.current = window.requestAnimationFrame(scanLoop);
        };

        scanRafRef.current = window.requestAnimationFrame(scanLoop);
      }

      scannerStartInFlightRef.current = false;
    } catch (error: unknown) {
      stopScanner();
      showScanAttemptError(
        getErrorMessage(error) ?? t("recordScorePage.validate.noCamera"),
      );
      scannerStartInFlightRef.current = false;
    }
  }, [onTokenDetected, scanBlocked, stopScanner, t]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  useEffect(() => {
    if (scanBlocked) {
      stopScanner();
    }
  }, [scanBlocked, stopScanner]);

  const videoRefCallback = useCallback(
    (node: HTMLVideoElement | null) => {
      videoRef.current = node;
      if (!node || scanBlocked) return;
      if (autoStart && !autoStartRequestedRef.current) {
        autoStartRequestedRef.current = true;
        cameraToastShownForAttemptRef.current = false;
        void startScanner();
      }
    },
    [autoStart, scanBlocked, startScanner],
  );

  const resetCameraToastForRetry = useCallback(() => {
    cameraToastShownForAttemptRef.current = false;
  }, []);

  return {
    videoRefCallback,
    stopScanner,
    startScanner,
    resetCameraToastForRetry,
  };
}
