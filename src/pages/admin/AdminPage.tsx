import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function AdminPage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 flex-col p-6">
      <h1 className="text-xl font-semibold">{t("admin.title")}</h1>
      <p className="mt-2 text-muted-foreground">
        {t("admin.dashboardDescription")}
      </p>
      <div className="mt-6">
        <Button asChild className="bg-brand-primary hover:bg-brand-primary-hover">
          <Link to="/admin/promote-super-admin">{t("admin.promoteToSuperAdminCta")}</Link>
        </Button>
      </div>
    </div>
  );
}
