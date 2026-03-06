export type AppleFlowLevel = "info" | "warn" | "error";
export type AppleFlowStatus = "processing" | "success" | "signup_required" | "error";

export interface AppleFlowEvent {
  at: string;
  level: AppleFlowLevel;
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface AppleFlowTrace {
  traceId: string;
  provider: "apple";
  startedAt: string;
  updatedAt: string;
  status: AppleFlowStatus;
  outcomeCode?: string;
  summary?: string;
  events: AppleFlowEvent[];
}

export const APPLE_FLOW_TRACE_KEY = "appleFlowTrace";

function decodeBase64UrlJson<T>(encoded: string): T | null {
  try {
    let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padding = base64.length % 4;
    if (padding) base64 += "=".repeat(4 - padding);
    const json = atob(base64);
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

function isAppleFlowTrace(value: unknown): value is AppleFlowTrace {
  if (!value || typeof value !== "object") return false;

  const trace = value as Partial<AppleFlowTrace>;
  return (
    typeof trace.traceId === "string" &&
    trace.provider === "apple" &&
    typeof trace.startedAt === "string" &&
    typeof trace.updatedAt === "string" &&
    (trace.status === "processing" ||
      trace.status === "success" ||
      trace.status === "signup_required" ||
      trace.status === "error") &&
    Array.isArray(trace.events)
  );
}

export function decodeAppleFlowTrace(encoded: string | null): AppleFlowTrace | null {
  if (!encoded || typeof encoded !== "string") return null;
  const parsed = decodeBase64UrlJson<unknown>(encoded);
  return isAppleFlowTrace(parsed) ? parsed : null;
}

export function readStoredAppleFlowTrace(): AppleFlowTrace | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(APPLE_FLOW_TRACE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    return isAppleFlowTrace(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function storeAppleFlowTrace(trace: AppleFlowTrace | null): void {
  if (typeof window === "undefined") return;
  if (!trace) {
    window.sessionStorage.removeItem(APPLE_FLOW_TRACE_KEY);
    return;
  }

  window.sessionStorage.setItem(APPLE_FLOW_TRACE_KEY, JSON.stringify(trace));
}

export function clearStoredAppleFlowTrace(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(APPLE_FLOW_TRACE_KEY);
}
