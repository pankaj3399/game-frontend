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
