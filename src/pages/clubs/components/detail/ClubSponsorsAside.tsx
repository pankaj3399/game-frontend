import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { GLOBAL_PARAMETERS } from "@/constants/constants";
import { buildMailtoHref } from "@/lib/mailto";
import { getSafeLink } from "@/lib/url";
import type { ClubPublic } from "@/pages/clubs/hooks";

interface ClubSponsorsAsideProps {
  club: ClubPublic;
  sponsors: ClubPublic["sponsors"];
  onRequireAuth: () => boolean;
  className?: string;
}

export function ClubSponsorsAside({
  club,
  sponsors,
  onRequireAuth,
  className,
}: ClubSponsorsAsideProps) {
  const { t } = useTranslation();
  const safeBookingLink = getSafeLink(club.bookingSystemUrl);
  const safeWebsiteLink = getSafeLink(club.website);

  const contactClubMailto = buildMailtoHref({
    baseMailto: GLOBAL_PARAMETERS.CONTACT_US_MAILTO,
    subject: `${t("clubs.requestTennisLesson")} — ${club.name}`,
    body: club.address,
  });

  return (
    <aside className={className}>
      <div className="rounded-xl border border-border bg-white p-4 shadow-sm sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          {t("clubs.ourSponsors")}
        </h2>
        {sponsors.length > 0 ? (
          <div className="mb-6 grid grid-cols-2 gap-3">
            {sponsors.map((sponsor) => {
              const safeSponsorLink = getSafeLink(sponsor.link);

              return (
                <div
                  key={sponsor.id}
                  className="flex aspect-[5/2] items-center justify-center overflow-hidden rounded-lg bg-[#f3f4f6] p-2"
                >
                  {sponsor.logoUrl ? (
                    safeSponsorLink ? (
                      <a
                        href={safeSponsorLink}
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
              );
            })}
          </div>
        ) : (
          <p className="mb-6 text-sm text-muted-foreground">{t("clubs.noSponsors")}</p>
        )}

        <div className="flex flex-col gap-3">
          {safeBookingLink ? (
            <a
              href={safeBookingLink}
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
          <Button
            type="button"
            variant="brand"
            className="w-full rounded-lg px-4 py-3"
            onClick={() => {
              if (!onRequireAuth()) return;
              window.location.assign(contactClubMailto);
            }}
          >
            {t("clubs.requestTennisLesson")}
          </Button>
          <button
            type="button"
            className="text-center text-sm font-medium text-muted-foreground underline hover:text-foreground"
            onClick={() => {
              if (!onRequireAuth()) return;
              if (safeWebsiteLink) {
                window.open(safeWebsiteLink, "_blank", "noopener,noreferrer");
              } else {
                window.location.assign(contactClubMailto);
              }
            }}
          >
            {t("clubs.becomeMember")}
          </button>
        </div>
      </div>
    </aside>
  );
}
