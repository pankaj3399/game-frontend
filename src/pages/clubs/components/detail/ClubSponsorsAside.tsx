import { useTranslation } from "react-i18next";
import type { ClubPublic } from "@/pages/clubs/hooks";

interface ClubSponsorsAsideProps {
  club: ClubPublic;
  sponsors: ClubPublic["sponsors"];
}

export function ClubSponsorsAside({ club, sponsors }: ClubSponsorsAsideProps) {
  const { t } = useTranslation();

  return (
    <aside>
      <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          {t("clubs.ourSponsors")}
        </h2>
        {sponsors.length > 0 ? (
          <div className="mb-6 grid grid-cols-2 gap-3">
            {sponsors.map((sponsor) => (
              <div
                key={sponsor.id}
                className="flex aspect-[5/2] items-center justify-center overflow-hidden rounded-lg bg-[#f3f4f6] p-2"
              >
                {sponsor.logoUrl ? (
                  sponsor.link ? (
                    <a
                      href={sponsor.link}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="h-full w-full"
                    >
                      <img
                        src={sponsor.logoUrl}
                        alt={sponsor.name}
                        className="h-full w-full object-contain"
                      />
                    </a>
                  ) : (
                    <img
                      src={sponsor.logoUrl}
                      alt={sponsor.name}
                      className="h-full w-full object-contain"
                    />
                  )
                ) : (
                  <span className="text-center text-xs font-medium text-muted-foreground">
                    {sponsor.name}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="mb-6 text-sm text-muted-foreground">{t("clubs.noSponsors")}</p>
        )}

        <div className="flex flex-col gap-3">
          {club.bookingSystemUrl ? (
            <a
              href={club.bookingSystemUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-center justify-center rounded-lg bg-[#1a1a1a] px-4 py-3 font-medium text-white transition-colors hover:bg-[#2d2d2d]"
            >
              {t("clubs.bookCourt")}
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="flex cursor-not-allowed items-center justify-center rounded-lg bg-[#e5e7eb] px-4 py-3 font-medium text-muted-foreground"
            >
              {t("clubs.bookCourt")}
            </button>
          )}
          <button
            type="button"
            className="flex items-center justify-center rounded-lg bg-brand-primary px-4 py-3 font-medium text-white transition-colors hover:bg-brand-primary-hover"
          >
            {t("clubs.requestTennisLesson")}
          </button>
          <button
            type="button"
            className="text-center text-sm font-medium text-muted-foreground underline hover:text-foreground"
          >
            {t("clubs.becomeMember")}
          </button>
        </div>
      </div>
    </aside>
  );
}
