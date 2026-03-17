import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { ClubListItem } from "@/pages/clubs/hooks";

interface ClubCardProps {
  club: ClubListItem;
}

export function ClubCard({ club }: ClubCardProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-t-xl bg-[#f3f4f6]">
        <div className="flex h-full w-full items-center justify-center rounded-t-xl bg-[#e5e7eb]">
          <span className="text-2xl font-semibold text-[#9ca3af]">
            {club.name.charAt(0) || "?"}
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold text-foreground">{club.name}</h3>
        {club.address ? (
          <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{club.address}</p>
        ) : null}
        <Link
          to={`/clubs/${club.id}`}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#0a9f43] hover:underline"
        >
          {t("clubs.viewDetails")}
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
