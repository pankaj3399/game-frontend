import { useTranslation } from "react-i18next";
import { InformationCircleIcon } from "@/icons/figma-icons";

export function ManageClubInfoCard() {
  const { t } = useTranslation();

  return (
    <div className="rounded-[12px] border border-[#c8d5e6] bg-[#eaf2fb] px-4 py-3">
      <div className="mb-2 flex items-center gap-2 text-[#0047ba]">
        <InformationCircleIcon size={18} className="shrink-0" />
        <p className="text-[14px] font-medium leading-none">{t("manageClub.adminManagement")}</p>
      </div>
      <ul className="list-disc space-y-1 pl-6 text-[13px] text-[#0b45a8]">
        <li>{t("manageClub.ruleDrag")}</li>
        <li>{t("manageClub.ruleDefault")}</li>
        <li>{t("manageClub.ruleExpiry")}</li>
        <li>{t("manageClub.ruleReactivate")}</li>
      </ul>
    </div>
  );
}