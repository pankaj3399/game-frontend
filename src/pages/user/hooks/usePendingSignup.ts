import {
  decodeJwtPayload,
  pendingSignupPayloadSchema,
} from "@/lib/auth";

interface UsePendingSignupOptions {
  pendingToken: string | null;
  fallbackEmail?: string;
}

export function usePendingSignup({
  pendingToken,
  fallbackEmail,
}: UsePendingSignupOptions) {
  const getPendingSignup = () => {
    if (!pendingToken) return null;

    try {
      return decodeJwtPayload(pendingToken, pendingSignupPayloadSchema);
    } catch {
      return null;
    }
  };

  const pendingSignup = getPendingSignup();
  const requiresEmailInput = pendingSignup?.requiresEmailInput === true;
  const displayEmail = pendingSignup?.pendingEmail ?? fallbackEmail ?? "";

  return {
    pendingSignup,
    requiresEmailInput,
    displayEmail,
  };
}
