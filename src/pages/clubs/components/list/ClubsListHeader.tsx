import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { Settings01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ClubsListHeaderProps {
  canManage: boolean;
  query: string;
  onQueryChange: (value: string) => void;
}

export function ClubsListHeader({
  canManage,
  query,
  onQueryChange,
}: ClubsListHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-xl font-semibold text-foreground">{t("clubs.allClubs")}</h1>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={t("clubs.searchPlaceholder")}
            className="h-9 w-full sm:w-[320px] lg:w-[360px]"
          />
          {canManage && (
            <Button variant="outline" size="sm" asChild>
              <Link to="/clubs/manage">
                <HugeiconsIcon icon={Settings01Icon} size={16} className="mr-2" />
                {t("clubs.manageClubs")}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
