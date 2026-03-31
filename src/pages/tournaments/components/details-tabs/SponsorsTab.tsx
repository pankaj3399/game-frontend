import { useTranslation } from "react-i18next";
import { ExternalLink } from "@/icons/figma-icons";
import type { TournamentDetail } from "@/models/tournament/types";
import { TabsContent } from "@/components/ui/tabs";

interface SponsorsTabProps {
  tournament: TournamentDetail;
}

export function SponsorsTab({ tournament }: SponsorsTabProps) {
  const { t } = useTranslation();
  const sponsors = tournament.clubSponsors ?? [];

  return (
    <TabsContent value="sponsors" className="mt-6">
      <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-foreground">
          {t("tournaments.clubSponsors")}
        </h2>

        {sponsors.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            {t("tournaments.noClubSponsors")}
          </p>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                        {sponsor.name.charAt(0) ?? "?"}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="font-semibold text-foreground">{sponsor.name}</h3>
                  {sponsor.link ? (
                    <a
                      href={sponsor.link}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#0a9f43] hover:underline"
                    >
                      {t("tournaments.viewSponsorDetails")}
                      <ExternalLink className="size-4" />
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </TabsContent>
  );
}
