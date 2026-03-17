import type { SyntheticEvent } from "react";
import { useCompleteSignup } from "@/pages/user/hooks/useCompleteSignup";
import { PENDING_SIGNUP_TOKEN_KEY } from "@/lib/auth";
import { toast } from "sonner";
import { useSignupFormState } from "@/pages/user/hooks/useSignupFormState";
import { formatDateForApi } from "@/utils/date";

interface UseUserInformationFormOptions {
  requiresEmailInput: boolean;
  displayEmail: string;
  onSuccess: () => void | Promise<void>;
}

export function useUserInformationForm({
  requiresEmailInput,
  displayEmail,
  onSuccess,
}: UseUserInformationFormOptions) {
  const {
    inputs,
    fieldErrors,
    setFieldErrors,
    handleInputChange,
    setDateOfBirth,
    setGender,
  } = useSignupFormState({
    initialEmail: requiresEmailInput ? "" : displayEmail,
  });

  const { submit, isLoading } = useCompleteSignup({
    getPendingToken: () => sessionStorage.getItem(PENDING_SIGNUP_TOKEN_KEY),
    onSuccess,
  });

  const onSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldErrors({});

    const dateOfBirthStr = formatDateForApi(inputs.dateOfBirth);

    const result = await submit({
      ...inputs,
      dateOfBirth: dateOfBirthStr,
    });

    if (result.success) return;

    if (result.fieldErrors) {
      setFieldErrors(result.fieldErrors);
      return;
    }

    if (result.message) {
      toast.error(result.message);
    }
  };

  return {
    inputs,
    fieldErrors,
    isLoading,
    onSubmit,
    handleInputChange,
    setDateOfBirth,
    setGender,
  };
}
