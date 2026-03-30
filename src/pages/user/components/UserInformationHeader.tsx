import { useTranslation } from "react-i18next";
import { UserIcon } from "@/icons/figma-icons";

export function UserInformationHeader() {
  const { t } = useTranslation();

  return (
    <div className="border-b border-[#e5e7eb] px-4 sm:px-6 pt-4 pb-4 flex items-center justify-between gap-3">
      <div>
        <h1 className="text-lg font-semibold text-foreground sm:text-xl">
          {t("signup.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("signup.subtitle")}</p>
      </div>
      <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-[#fef9c3] text-[#854d0e]">
        <UserIcon size={20} className="text-muted-foreground" />
      </div>
    </div>
  );
}
