import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function ClubDetailNotFound() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 bg-gray-50 p-4">
      <p className="text-muted-foreground">{t("clubs.clubNotFound")}</p>
      <Link
        to="/clubs"
        className="text-sm font-medium text-brand-primary hover:underline"
      >
        {t("clubs.backToClubs")}
      </Link>
    </div>
  );
}
