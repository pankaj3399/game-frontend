import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { parseISO } from "date-fns";
import { api } from "@/lib/api";
import { PENDING_SIGNUP_TOKEN_KEY } from "@/lib/auth";
import { signupFormSchema, type SignupFormValues } from "@/lib/validation";

/** Form data without pendingToken (injected from sessionStorage). */
export type CompleteSignupFormData = Omit<SignupFormValues, "pendingToken">;

interface UseCompleteSignupOptions {
  onSuccess: () => void | Promise<void>;
  getPendingToken: () => string | null;
}

interface CompleteSignupResult {
  success: boolean;
  fieldErrors?: Record<string, string>;
  message?: string;
}

/**
 * Encapsulates the complete-signup mutation: validation, API call, and side effects.
 * Backend is idempotent, so double submission is safe.
 */
export function useCompleteSignup({
  onSuccess,
  getPendingToken,
}: UseCompleteSignupOptions) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const onSuccessRef = useRef(onSuccess);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  async function submit(
    rawData: CompleteSignupFormData
  ): Promise<CompleteSignupResult> {
    const pendingToken = getPendingToken();
    if (!pendingToken) {
      return {
        success: false,
        message: "Session expired. Please sign in again.",
      };
    }

    const result = signupFormSchema.safeParse({
      ...rawData,
      pendingToken,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      const flattened = result.error.flatten();
      if (Object.keys(flattened.fieldErrors).length > 0) {
        Object.entries(flattened.fieldErrors).forEach(([key, msgs]) => {
          if (msgs?.[0]) fieldErrors[key] = msgs[0];
        });
      }
      return { success: false, fieldErrors };
    }

    const parsed = result.data;
    let dateOfBirth: string | null = null;
    if (parsed.dateOfBirth) {
      const date = parseISO(parsed.dateOfBirth);
      dateOfBirth = new Date(
        Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
      ).toISOString();
    }

    setIsLoading(true);
    try {
      const response = await api.post("/api/auth/complete-signup", {
        pendingToken: parsed.pendingToken,
        alias: parsed.alias,
        name: parsed.name,
        dateOfBirth,
        gender: parsed.gender || null,
      });

      if (
        response.status === 200 &&
        !response?.data?.error &&
        response?.data?.code === "SIGNUP_SUCCESSFUL"
      ) {
        sessionStorage.removeItem(PENDING_SIGNUP_TOKEN_KEY);
        await onSuccessRef.current();
        return { success: true };
      }

      return {
        success: false,
        message: response?.data?.message ?? "Sign up failed.",
      };
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string; code?: string } };
      };
      const data = err?.response?.data;
      const msg = data?.message ?? "Sign up failed. Please try again.";
      const code = data?.code;
      const isTokenError =
        code === "INVALID_TOKEN" ||
        (typeof msg === "string" &&
          /token\s*(expired|invalid)|invalid\s*(or\s*)?expired\s*signup\s*token/i.test(msg));
      if (isTokenError) {
        sessionStorage.removeItem(PENDING_SIGNUP_TOKEN_KEY);
        navigate("/login", { replace: true });
      }
      if (code === "EMAIL_ALREADY_EXISTS") {
        return { success: false, message: msg, fieldErrors: { email: msg } };
      }
      return { success: false, message: msg };
    } finally {
      setIsLoading(false);
    }
  }

  return { submit, isLoading };
}
