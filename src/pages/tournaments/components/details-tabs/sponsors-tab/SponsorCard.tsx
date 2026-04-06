import { ExternalLink } from "@/icons/figma-icons";
import type { TournamentSponsor } from "@/models/tournament/types";
import type { TFunction } from "i18next";

interface SponsorCardProps {
  sponsor: TournamentSponsor;
  t: TFunction;
}

export function SponsorCard({ sponsor, t }: SponsorCardProps) {
  const safeSponsorLink = (() => {
    const rawLink = sponsor.link?.trim();
    if (!rawLink) return null;

    try {
      const parsed = new URL(rawLink);
      return parsed.protocol === "http:" || parsed.protocol === "https:" ? rawLink : null;
    } catch {
      return null;
    }
  })();

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-t-xl bg-[#f3f4f6]">
        {sponsor.logoUrl ? (
          <img
            src={sponsor.logoUrl}
            alt={sponsor.name}
            className="h-full w-full object-contain p-4"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-t-xl bg-[#e5e7eb]">
            <span className="text-sm font-medium text-[#9ca3af]">{sponsor.name.charAt(0) || "?"}</span>
          </div>
        )}
      </div>
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
