/**
 * Safely extracts a user-facing error message from unknown error types.
 * Handles axios-like errors (response.data.message) and standard Error instances.
 */
export function getErrorMessage(err: unknown): string | null {
  if (!err || typeof err !== "object") return null;
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

  const apiData = withResponse?.response?.data;
  if (typeof apiData?.message === "string" && apiData.message.trim()) {
    return apiData.message;
  }
  if (typeof apiData?.error === "string" && apiData.error.trim()) {
    return apiData.error;
  }
  if (typeof apiData?.details === "string" && apiData.details.trim()) {
    return apiData.details;
  }
  if (Array.isArray(apiData?.errors) && apiData.errors.length > 0) {
    const first = apiData.errors.find((value) => typeof value === "string" && value.trim().length > 0);
    if (first) return first;
  }

  if (err instanceof Error && err.message) return err.message;
  return null;
}

/**
 * Safely extract an HTTP status code from an unknown error (e.g. axios error).
 * Returns the numeric status code or `undefined` if not available.
 */
export function getHttpStatus(err: unknown): number | undefined {
  if (!err || typeof err !== "object") return undefined;
  const maybe = err as { response?: { status?: unknown } };
  if (!maybe.response || typeof maybe.response !== "object") return undefined;
  const status = maybe.response.status;
  return typeof status === "number" ? status : undefined;
}
