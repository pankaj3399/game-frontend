import { useTranslation } from "react-i18next";
import type { ClubSponsor } from "@/pages/sponsors/hooks";
import type { CreateTournamentInput } from "@/models/tournament/types";
import { TabsContent } from "@/components/ui/tabs";

interface SponsorTabProps {
  form: CreateTournamentInput;
  sponsors: ClubSponsor[];
  update: (updates: Partial<CreateTournamentInput>) => void;
}

function SponsorCard({
  selected,
  title,
  subtitle,
  onClick,
}: {
  selected: boolean;
  title: string;
  subtitle?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-colors ${
        selected
          ? "border-[#27a457] bg-[#f7fbf8] ring-1 ring-[#27a457]"
          : "border-[#e5e7eb] bg-[#f3f4f6] hover:bg-[#eef0f2]"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-md bg-[#d8dadd]" />
        <div>
          <p className="text-[14px] font-medium leading-tight text-[#1f2937]">{title}</p>
          {subtitle ? (
            <p className="mt-0.5 text-[13px] leading-tight text-[#6b7280]">{subtitle}</p>
          ) : null}
        </div>
      </div>
      <span
        className={`h-4 w-4 rounded-full border ${
          selected ? "border-[#27a457] ring-4 ring-[#27a457] ring-offset-2" : "border-[#d1d5db]"
        }`}
      />
    </button>
  );
}

export function SponsorTab({ form, sponsors, update }: SponsorTabProps) {
  const { t } = useTranslation();
  const activeSponsors = sponsors.filter((s) => s.status === "active");

  return (
    <TabsContent value="sponsor" className="mt-0">
      <div className="space-y-3">
        <h3 className="text-[15px] font-semibold text-[#1f2937]">
          {t("tournaments.selectSponsor")}
        </h3>
        <p className="max-w-[540px] text-[14px] leading-snug text-[#6b7280]">
          {t("tournaments.selectSponsorHint")}
        </p>

        {!form.club ? (
          <p className="text-[14px] text-[#6b7280]">{t("tournaments.selectClubFirst")}</p>
        ) : (
          <div className="space-y-2">
            <SponsorCard
              selected={form.sponsor == null || form.sponsor === ""}
              title={t("tournaments.noSponsor")}
              onClick={() => update({ sponsor: null })}
            />

            {activeSponsors.map((sponsor) => (
              <SponsorCard
                key={sponsor.id}
                selected={form.sponsor === sponsor.id}
                title={sponsor.name}
                subtitle={t("tournaments.officialSponsor")}
                onClick={() => update({ sponsor: sponsor.id })}
              />
            ))}
          </div>
        )}
      </div>
    </TabsContent>
  );
}
