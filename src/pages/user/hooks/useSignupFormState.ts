import { useState } from "react";
import type { ChangeEvent } from "react";
import type { SignupFieldErrors,  SignupInputs } from "@/pages/user/types";

interface UseSignupFormStateOptions {
  initialEmail: string;
}

export function useSignupFormState({ initialEmail }: UseSignupFormStateOptions) {
  const [fieldErrors, setFieldErrors] = useState<SignupFieldErrors>({});
  const [inputs, setInputs] = useState<SignupInputs>({
    email: initialEmail,
    alias: "",
    name: "",
    dateOfBirth: undefined,
    gender: "",
  });

  const clearError = (field: string) => {
    if (!fieldErrors[field]) return;
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
    clearError(name);
  };

  const setDateOfBirth = (date: Date | undefined) => {
    setInputs((prev) => ({ ...prev, dateOfBirth: date }));
    clearError("dateOfBirth");
  };

  const setGender = (value: string) => {
    setInputs((prev) => ({
      ...prev,
      gender:
        value === "male" || value === "female" || value === "other"
          ? (value)
          : "",
    }));
    clearError("gender");
  };

  return {
    inputs,
    setInputs,
    fieldErrors,
    setFieldErrors,
    handleInputChange,
    setDateOfBirth,
    setGender,
  };
}
