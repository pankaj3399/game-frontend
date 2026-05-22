import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { ClubPublic } from "@/pages/clubs/hooks";

interface ClubDetailHeaderProps {
  club: ClubPublic;
}

export function ClubDetailHeader({ club }: ClubDetailHeaderProps) {
  const { t } = useTranslation();

  return (
    <>
      <Link
        to="/clubs"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        ← {t("clubs.goBack")}
      </Link>

      <div className="mb-5 flex min-w-0 items-start gap-3 sm:gap-4">
        <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#e8e6e3] sm:size-16">
          {club.logoUrl ? (
            <img src={club.logoUrl} alt={club.name} className="size-full object-cover" />
          ) : (
            <span className="text-xl font-semibold text-[#9ca3af] sm:text-2xl">
              {club.name.charAt(0)}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-bold leading-snug text-foreground sm:text-lg sm:leading-tight md:text-2xl">
            {club.name}
          </h1>
          {club.description ? (
            <p className="mt-0.5 text-sm text-muted-foreground sm:break-words">{club.description}</p>
          ) : null}
        </div>
      </div>

      <div className="mb-6 aspect-[16/9] w-full min-w-0 overflow-hidden rounded-xl bg-[#e5e7eb] sm:mb-8 sm:aspect-[21/6]">
        {club.logoUrl ? (
          <img src={club.logoUrl} alt="" className="size-full object-cover" />
        ) : null}
      </div>
    </>
  );
}
