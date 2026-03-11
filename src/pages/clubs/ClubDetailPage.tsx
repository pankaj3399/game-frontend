import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MapPin, Globe } from "lucide-react";
import { useClubPublic } from "@/hooks/club";
import InlineLoader from "@/components/shared/InlineLoader";
export default function ClubDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data: club, isLoading } = useClubPublic(id);

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50">
        <InlineLoader />
      </div>
    );
  }

  if (!club) {
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

  const courts = club.courts ?? [];
  const sponsors = club.sponsors ?? [];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="mx-auto max-w-6xl p-4 sm:p-6">
        {/* Go back */}
        <Link
          to="/clubs"
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          ← {t("clubs.goBack")}
        </Link>

        {/* Club header */}
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

        {/* Full-width banner */}
        <div className="mb-8 aspect-[21/6] w-full overflow-hidden rounded-xl bg-[#e5e7eb]" />

        {/* Two-column layout: Club Info + Courts | Sponsors */}
        <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left: Club Info + Courts */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            {/* Club Info */}
            <section>
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                {t("clubs.clubInfo")}
              </h2>
              <div className="grid gap-6 sm:grid-cols-2">
                {club.address ? (
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <MapPin className="size-5 shrink-0 text-muted-foreground" />
                      <span className="font-medium text-foreground">
                        {t("clubs.address")}
                      </span>
                    </div>
                    <p className="whitespace-pre-line pl-7 text-muted-foreground">
                      {club.address}
                    </p>
                  </div>
                ) : null}
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Globe className="size-5 shrink-0 text-muted-foreground" />
                    <span className="font-medium text-foreground">
                      {t("clubs.website")}
                    </span>
                  </div>
                  <div className="pl-7">
                  {club.website ? (
                    <>
                      <a
                        href={club.website}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-blue-600 underline hover:text-blue-700"
                      >
                        {club.website}
                      </a>
                      <a
                        href={club.website}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand-primary hover:underline"
                      >
                        {t("clubs.viewWebsite")} →
                      </a>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {t("clubs.websiteNotProvided")}
                    </p>
                  )}
                  </div>
                </div>
              </div>
            </section>

            {/* Courts */}
            {courts.length > 0 ? (
              <section>
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  {t("clubs.courts")}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {courts.map((court) => (
                    <div
                      key={court.placement}
                      className="rounded-xl border border-border bg-white p-4"
                    >
                      <p className="font-semibold text-foreground">
                        {court.placement === "outdoor"
                          ? t("clubs.outdoorCourts")
                          : t("clubs.indoorCourts")}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t("clubs.courtsCountSurface", {
                          count: court.count,
                          surface: court.surface,
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          {/* Right: Sponsors + CTAs */}
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
                            rel="noreferrer"
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
                <p className="mb-6 text-sm text-muted-foreground">
                  {t("clubs.noSponsors")}
                </p>
              )}

              <div className="flex flex-col gap-3">
                {club.bookingSystemUrl ? (
                  <a
                    href={club.bookingSystemUrl}
                    target="_blank"
                    rel="noreferrer"
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
        </div>
      </div>
    </div>
  );
}
