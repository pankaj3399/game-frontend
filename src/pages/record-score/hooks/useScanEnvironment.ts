import { useCallback, useEffect, useRef, useState } from "react";

export type ScanEnvironmentState =
  | "checking"
  | "ready"
  | "noCamera"
  | "noMediaApi";

export function useScanEnvironment() {
  const mountedRef = useRef(true);
  const [scanEnvironment, setScanEnvironment] =
    useState<ScanEnvironmentState>("checking");

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refreshScanEnvironment = useCallback(async () => {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      if (mountedRef.current) setScanEnvironment("noMediaApi");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      if (mountedRef.current) setScanEnvironment("noMediaApi");
      return;
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      if (!mountedRef.current) return;
      const hasVideo = devices.some((d) => d.kind === "videoinput");
      setScanEnvironment(hasVideo ? "ready" : "noCamera");
    } catch {
      if (mountedRef.current) setScanEnvironment("noCamera");
    }
  }, []);

  useEffect(() => {
    // Async probe of enumerateDevices / APIs; ties React state to browser media capabilities.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- refreshScanEnvironment updates state from MediaDevices (external)
    void refreshScanEnvironment();
  }, [refreshScanEnvironment]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.addEventListener) {
      return;
    }
    const onDeviceChange = () => {
      void refreshScanEnvironment();
    };
    navigator.mediaDevices.addEventListener("devicechange", onDeviceChange);
    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", onDeviceChange);
    };
  }, [refreshScanEnvironment]);

  return { scanEnvironment, refreshScanEnvironment };
}
