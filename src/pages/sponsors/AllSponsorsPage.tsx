import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ExternalLink, PlusSignIcon } from "@/icons/figma-icons";
import { useAllSponsors } from "@/pages/sponsors/hooks";
import InlineLoader from "@/components/shared/InlineLoader";
import { GLOBAL_PARAMETERS } from "@/constants/constants";
import { buildMailtoHref } from "@/lib/mailto";

export default function AllSponsorsPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useAllSponsors();

  const becomeSponsorMailto = useMemo(
    () =>
      buildMailtoHref({
        baseMailto: GLOBAL_PARAMETERS.CONTACT_US_MAILTO,
        subject: t("sponsors.becomeSponsorEmailSubject"),
        body: t("sponsors.becomeSponsorEmailBody"),
      }),
    [t],
  );

  const sponsors = data?.sponsors ?? [];

  return (
    <div className="flex min-h-[calc(100vh-4rem)] justify-center bg-gray-50">
      <div className="mx-auto w-full max-w-6xl p-4 sm:p-6">
        <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 lg:mb-6">
            <h1 className="text-2xl font-bold text-foreground">
              {t("sponsors.allSponsors")}
            </h1>
            <a
              id="become-sponsor-btn"
              href={becomeSponsorMailto}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0a9f43] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#088a38] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a9f43] sm:ml-auto"
            >
              <PlusSignIcon size={16} className="shrink-0 text-white" />
              {t("sponsors.becomeSponsor")}
            </a>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <InlineLoader />
            </div>
          ) : sponsors.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">
              {t("sponsors.noSponsorsYet")}
            </p>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sponsors.map((sponsor) => (
                <div
                  key={sponsor.id}
                  className="flex flex-col overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-t-xl bg-[#f3f4f6]">
                    {sponsor.logoUrl ? (
                      <img
                        src={sponsor.logoUrl}
                        alt={sponsor.name}
                        className="h-full w-full object-contain p-4"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-t-xl bg-[#e5e7eb]">
                        <span className="text-sm font-medium text-[#9ca3af]">
                          {sponsor.name.charAt(0) || "?"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="font-semibold text-foreground">{sponsor.name}</h3>
                    {sponsor.description ? (
                      <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                        {sponsor.description}
                      </p>
                    ) : null}
                    {sponsor.link ? (
                      <a
                        href={sponsor.link}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#0a9f43] hover:underline"
                      >
                        {t("sponsors.visitWebsite")}
                        <ExternalLink className="size-4" />
                      </a>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
