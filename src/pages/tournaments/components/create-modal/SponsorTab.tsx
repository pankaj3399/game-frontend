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
  logoUrl,
  hideAvatar = false,
  onClick,
}: {
  selected: boolean;
  title: string;
  subtitle?: string;
  logoUrl?: string | null;
  hideAvatar?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex w-full items-center justify-between rounded-[12px] border px-[13px] py-3 text-left transition-colors ${
        selected
          ? "border-[1.5px] border-brand-primary bg-brand-primary/[0.05]"
          : "border-[#e1e3e8] bg-[#f9fafc] hover:bg-[#f4f7fb]"
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        {!hideAvatar ? (
          logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              className="h-10 w-10 shrink-0 rounded-[8px] object-cover"
            />
          ) : (
            <div className="h-10 w-10 shrink-0 rounded-[8px] bg-[#d9d9d9]" />
          )
        ) : null}
        <div>
          <p className="text-[16px] font-medium leading-[1.2] text-[#010a04]">{title}</p>
          {subtitle ? (
            <p className="mt-[5px] text-[14px] leading-tight text-[#010a04]/70">{subtitle}</p>
          ) : null}
        </div>
      </div>
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full border transition-colors ${
          selected ? "border-brand-primary" : "border-black/15"
        }`}
      >
        <span
          className={`h-2.5 w-2.5 rounded-full transition-colors ${
            selected ? "bg-brand-primary" : "bg-transparent"
          }`}
        />
      </span>
    </button>
  );
}

export function SponsorTab({ form, sponsors, update }: SponsorTabProps) {
  const { t } = useTranslation();
  const activeSponsors = sponsors.filter((s) => s.status === "active");

  return (
    <TabsContent value="sponsor" className="mt-0">
      <div className="space-y-[14px]">
        <h3 className="text-[18px] font-medium leading-[1.3] text-[#010a04]">
          {t("tournaments.selectSponsor")}
        </h3>
        <p className="max-w-[540px] text-[14px] leading-[1.4] text-[#010a04]/60">
          {t("tournaments.selectSponsorHint")}
        </p>

        {!form.club ? (
          <p className="text-[14px] text-[#010a04]/60">{t("tournaments.selectClubFirst")}</p>
        ) : (
          <div className="space-y-2">
            <SponsorCard
              selected={form.sponsor == null || form.sponsor === ""}
              title={t("tournaments.noSponsor")}
              hideAvatar
              onClick={() => update({ sponsor: null })}
            />

            {activeSponsors.map((sponsor) => (
              <SponsorCard
                key={sponsor.id}
                selected={form.sponsor === sponsor.id}
                title={sponsor.name}
                subtitle={sponsor.description?.trim() || t("tournaments.officialSponsor")}
                logoUrl={sponsor.logoUrl}
                onClick={() => update({ sponsor: sponsor.id })}
              />
            ))}
          </div>
        )}
      </div>
    </TabsContent>
  );
}
