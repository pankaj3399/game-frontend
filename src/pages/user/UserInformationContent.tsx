import { useNavigate } from "react-router-dom";
import { useAuth } from "@/pages/auth/hooks";
import { usePendingSignup } from "@/pages/user/hooks/usePendingSignup";
import { useUserInformationForm } from "@/pages/user/hooks/useUserInformationForm";
import { UserInformationHeader } from "@/pages/user/components/UserInformationHeader";
import { UserInformationForm } from "@/pages/user/components/UserInformationForm";

interface UserInformationContentProps {
  pendingToken: string | null;
}

export function UserInformationContent({ pendingToken }: UserInformationContentProps) {
  const navigate = useNavigate();
  const { user, checkAuth } = useAuth();
  const { requiresEmailInput, displayEmail } = usePendingSignup({
    pendingToken,
    fallbackEmail: user?.email,
  });

  const {
    inputs,
    fieldErrors,
    isLoading,
    onSubmit,
    handleInputChange,
    setDateOfBirth,
    setGender,
  } = useUserInformationForm({
    requiresEmailInput,
    displayEmail,
    onSuccess: async () => {
      await checkAuth();
      navigate("/profile", { replace: true });
    },
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center py-6 sm:py-8 px-4 sm:px-6 bg-gray-50">
      <div className="mx-auto w-full max-w-3xl min-w-0">
        <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
          <UserInformationHeader />
          <UserInformationForm
            requiresEmailInput={requiresEmailInput}
            displayEmail={displayEmail}
            inputs={inputs}
            fieldErrors={fieldErrors}
            isLoading={isLoading}
            onSubmit={onSubmit}
            onInputChange={handleInputChange}
            onDateOfBirthChange={setDateOfBirth}
            onGenderChange={setGender}
          />
        </div>
      </div>
    </div>
  );
}
