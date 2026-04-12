import { ExternalLink } from "@/icons/figma-icons";
import { getSafeLink } from "@/lib/url";
import type { TournamentSponsor } from "@/models/tournament/types";
import type { TFunction } from "i18next";

interface SponsorCardProps {
  sponsor: TournamentSponsor;
  t: TFunction;
}

export function SponsorCard({ sponsor, t }: SponsorCardProps) {
  const safeSponsorLink = getSafeLink(sponsor.link);
  const nameForInitial = sponsor.name?.trim() ?? "";
  const nameInitial = nameForInitial.charAt(0) || "?";

  const mediaShellClass =
    "flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-t-xl bg-[#f3f4f6]";

  const logoInner = sponsor.logoUrl ? (
    <img
      src={sponsor.logoUrl}
      alt={sponsor.name}
      className="h-full w-full object-contain p-4"
      loading="lazy"
      decoding="async"
    />
  ) : (
    <div className="flex h-full w-full items-center justify-center rounded-t-xl bg-[#e5e7eb]">
      <span className="text-sm font-medium text-[#9ca3af]">{nameInitial}</span>
    </div>
  );

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md">
      {safeSponsorLink ? (
        <a
          href={safeSponsorLink}
          target="_blank"
          rel="noreferrer noopener"
          className={`${mediaShellClass} outline-offset-2 transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
          aria-label={t("tournaments.openSponsorWebsite", { name: sponsor.name })}
        >
          {logoInner}
        </a>
      ) : (
        <div className={mediaShellClass}>{logoInner}</div>
      )}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold text-foreground">{sponsor.name}</h3>
        {safeSponsorLink ? (
          <a
            href={safeSponsorLink}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#0a9f43] hover:underline"
          >
            {t("tournaments.viewSponsorDetails", { name: sponsor.name })}
            <ExternalLink className="size-4" aria-hidden />
          </a>
        ) : null}
      </div>
    </div>
  );
}
