import { useTranslation } from "react-i18next";
import { Globe, MapPin } from "@/icons/figma-icons";
import { getSafeLink } from "@/lib/url";
import type { ClubPublic } from "@/pages/clubs/hooks";

interface ClubInfoSectionProps {
  club: ClubPublic;
}

export function ClubInfoSection({ club }: ClubInfoSectionProps) {
  const { t } = useTranslation();
  const safeWebsiteLink = getSafeLink(club.website);

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-foreground">{t("clubs.clubInfo")}</h2>
      <div className="grid gap-6 sm:grid-cols-2">
        {club.address ? (
          <div>
            <div className="mb-2 flex items-center gap-2">
              <MapPin className="size-5 shrink-0 text-muted-foreground" />
              <span className="font-medium text-foreground">{t("clubs.address")}</span>
            </div>
            <p className="whitespace-pre-line pl-7 text-muted-foreground">{club.address}</p>
          </div>
        ) : null}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Globe className="size-5 shrink-0 text-muted-foreground" />
            <span className="font-medium text-foreground">{t("clubs.website")}</span>
          </div>
          <div className="pl-7">
            {safeWebsiteLink ? (
              <>
                <a
                  href={safeWebsiteLink}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="block text-blue-600 underline hover:text-blue-700"
                >
                  {safeWebsiteLink}
                </a>
                <a
                  href={safeWebsiteLink}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand-primary hover:underline"
                >
                  {t("clubs.viewWebsite")} →
                </a>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{t("clubs.websiteNotProvided")}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
