import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { Settings01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";

interface ClubsListHeaderProps {
  canManage: boolean;
}

export function ClubsListHeader({ canManage }: ClubsListHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-xl font-semibold text-foreground">{t("clubs.allClubs")}</h1>
      {canManage && (
        <Button variant="outline" size="sm" asChild>
          <Link to="/clubs/manage">
            <HugeiconsIcon icon={Settings01Icon} size={16} className="mr-2" />
            {t("clubs.manageClubs")}
          </Link>
        </Button>
      )}
    </div>
  );
}
