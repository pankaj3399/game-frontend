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

      <div className="mb-5 flex items-start gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#e8e6e3]">
          <span className="text-2xl font-semibold text-[#9ca3af]">
            {club.name.charAt(0)}
          </span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{club.name}</h1>
          {club.description ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{club.description}</p>
          ) : null}
        </div>
      </div>

      <div className="mb-8 aspect-[21/6] w-full overflow-hidden rounded-xl bg-[#e5e7eb]" />
    </>
  );
}
