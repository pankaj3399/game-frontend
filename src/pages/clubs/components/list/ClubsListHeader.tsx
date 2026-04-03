import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Settings01Icon } from "@/icons/figma-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import InlineLoader from "@/components/shared/InlineLoader";

interface ClubsListHeaderProps {
  canManage: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  showSearchingHint?: boolean;
}

export function ClubsListHeader({
  canManage,
  query,
  onQueryChange,
  showSearchingHint = false,
}: ClubsListHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-xl font-semibold text-foreground">{t("clubs.allClubs")}</h1>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-[320px] lg:w-[360px]">
            <Input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder={t("clubs.searchPlaceholder")}
              className={showSearchingHint ? "h-9 pr-9" : "h-9"}
              aria-busy={showSearchingHint}
            />
            {showSearchingHint && (
              <span
                className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              >
                <InlineLoader size="sm" />
              </span>
            )}
          </div>
          {canManage && (
            <Button variant="outline" size="sm" asChild>
              <Link to="/clubs/manage">
                <Settings01Icon size={16} className="mr-2" />
                {t("clubs.manageClubs")}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
