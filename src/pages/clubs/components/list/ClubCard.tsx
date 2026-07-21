import { ArrowRight } from "@/icons/figma-icons";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { ClubListItem } from "@/pages/clubs/hooks";

interface ClubCardProps {
  club: ClubListItem;
}

export function ClubCard({ club }: ClubCardProps) {
  const { t } = useTranslation();

  return (
    <Link
      to={`/clubs/${club.id}`}
      aria-label={t("clubs.openClubCard", { name: club.name })}
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-border bg-white shadow-sm text-inherit no-underline transition-shadow",
        "hover:shadow-md active:shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/45"
      )}
    >
      <div className="flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-t-xl bg-[#f3f4f6]">
        <div className="flex h-full w-full items-center justify-center rounded-t-xl bg-[#e5e7eb]">
          {club.logoUrl ? (
            <img src={club.logoUrl} alt="" className="size-full object-cover" />
          ) : (
            <span className="text-2xl font-semibold text-[#9ca3af]">
              {club.name.charAt(0) || "?"}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold text-foreground">{club.name}</h3>
        {club.address ? (
          <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{club.address}</p>
        ) : null}
        <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand-primary">
          {t("clubs.viewDetails")}
          <ArrowRight className="size-4" />
        </span>
      </div>
    </Link>
  );
}
