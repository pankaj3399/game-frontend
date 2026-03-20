import { useTranslation } from "react-i18next";

export default function AdminPage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 flex-col p-6">
      <h1 className="text-xl font-semibold">{t("admin.title")}</h1>
      <p className="mt-2 text-muted-foreground">
        {t("admin.dashboardDescription")}
      </p>
    </div>
  );
}
