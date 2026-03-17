import type { ChangeEvent, SyntheticEvent } from "react";
import type { SignupFieldErrors, SignupInputs } from "@/pages/user/types";
import { UserInformationEmailField } from "@/pages/user/components/UserInformationEmailField";
import { UserInformationIdentityFields } from "@/pages/user/components/UserInformationIdentityFields";
import { UserInformationProfileFields } from "@/pages/user/components/UserInformationProfileFields";
import { UserInformationSubmitButton } from "@/pages/user/components/UserInformationSubmitButton";

interface UserInformationFormProps {
  requiresEmailInput: boolean;
  displayEmail: string;
  inputs: SignupInputs;
  fieldErrors: SignupFieldErrors;
  isLoading: boolean;
  onSubmit: (e: SyntheticEvent<HTMLFormElement>) => Promise<void>;
  onInputChange: (e: ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void;
  onDateOfBirthChange: (date: Date | undefined) => void;
  onGenderChange: (value: string) => void;
}

export function UserInformationForm({
  requiresEmailInput,
  displayEmail,
  inputs,
  fieldErrors,
  isLoading,
  onSubmit,
  onInputChange,
  onDateOfBirthChange,
  onGenderChange,
}: UserInformationFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-0">
      <div className="space-y-6 px-4 py-5 sm:px-6 sm:py-6">
        <UserInformationEmailField
          requiresEmailInput={requiresEmailInput}
          displayEmail={displayEmail}
          email={inputs.email}
          emailError={fieldErrors.email}
          onInputChange={onInputChange}
        />

        <UserInformationIdentityFields
          alias={inputs.alias}
          name={inputs.name}
          aliasError={fieldErrors.alias}
          nameError={fieldErrors.name}
          onInputChange={onInputChange}
        />

        <UserInformationProfileFields
          dateOfBirth={inputs.dateOfBirth}
          gender={inputs.gender}
          dateOfBirthError={fieldErrors.dateOfBirth}
          genderError={fieldErrors.gender}
          onDateOfBirthChange={onDateOfBirthChange}
          onGenderChange={onGenderChange}
        />
      </div>

      <div className="border-t border-[#e5e7eb] px-4 py-4 sm:px-6">
        <UserInformationSubmitButton isLoading={isLoading} />
      </div>
    </form>
  );
}
