import { useTranslation } from "react-i18next";
import { ArrowRight01Icon } from "@/icons/figma-icons";
import { Button } from "@/components/ui/button";
import InlineLoader from "@/components/shared/InlineLoader";

interface UserInformationSubmitButtonProps {
  isLoading: boolean;
}

export function UserInformationSubmitButton({
  isLoading,
}: UserInformationSubmitButtonProps) {
  const { t } = useTranslation();

  return (
    <Button
      type="submit"
      disabled={isLoading}
      className="h-11 w-full gap-2 bg-brand-accent text-black text-sm font-medium transition-all hover:bg-brand-accent-hover active:scale-[0.99]"
    >
      {isLoading ? (
        <>
          <InlineLoader size="sm" />
          {t("signup.signingUp")}
        </>
      ) : (
        <>
          {t("signup.submit")}
          <ArrowRight01Icon size={18} />
        </>
      )}
    </Button>
  );
}
