/**
 * Safely extracts a user-facing error message from unknown error types.
 * Handles axios-like errors (response.data.message) and standard Error instances.
 */

function trimmedNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const t = value.trim();
  return t.length > 0 ? t : undefined;
}

export function getErrorMessage(err: unknown): string | null {
  if (typeof err === "string" || err instanceof String) {
    const fromString = trimmedNonEmptyString(String(err));
    return fromString ?? String(err);
  }
  if (err === null || typeof err !== "object") return null;
  const withResponse = err as {
    response?: {
      data?: {
        message?: string;
        error?: string;
        details?: string;
        errors?: string[];
      };
      status?: number;
    };
  };

  const apiData = withResponse.response?.data;
  const fromField =
    trimmedNonEmptyString(apiData?.message) ??
    trimmedNonEmptyString(apiData?.error) ??
    trimmedNonEmptyString(apiData?.details);
  if (fromField) return fromField;

  if (Array.isArray(apiData?.errors) && apiData.errors.length > 0) {
    const first = apiData.errors.find((value) => trimmedNonEmptyString(value) !== undefined);
    if (first !== undefined) {
      const trimmed = trimmedNonEmptyString(first);
      if (trimmed) return trimmed;
    }
  }

  if (err instanceof Error && err.message) return err.message;
  return null;
}

/**
 * Safely extract an HTTP status code from an unknown error (e.g. axios error).
 * Returns the numeric status code or `undefined` if not available.
 */
export function getHttpStatus(err: unknown): number | undefined {
  if (err === null || typeof err !== "object") return undefined;
  const status = (err as { response?: { status?: unknown } }).response?.status;
  return typeof status === "number" &&
    Number.isInteger(status) &&
    status >= 100 &&
    status <= 599
    ? status
    : undefined;
}
