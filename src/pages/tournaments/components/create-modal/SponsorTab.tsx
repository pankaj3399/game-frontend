import { useTranslation } from "react-i18next";
import type { ClubSponsor } from "@/pages/sponsors/hooks";
import type { CreateTournamentInput } from "@/models/tournament/types";
import {
  RadioGroup,
  RadioGroupCardItem,
} from "@/components/ui/radio-group";
import InlineLoader from "@/components/shared/InlineLoader";
import { modalLabelClass, modalMetaTextClass } from "@/pages/tournaments/components/create-modal/formStyles";

interface SponsorTabProps {
  form: CreateTournamentInput;
  sponsors: ClubSponsor[];
  update: (updates: Partial<CreateTournamentInput>) => void;
  loading?: boolean;
}

const NO_SPONSOR_VALUE = "";

function SponsorCard({
  value,
  title,
  subtitle,
  logoUrl,
  hideAvatar = false,
}: {
  value: string;
  title: string;
  subtitle?: string;
  logoUrl?: string | null;
  hideAvatar?: boolean;
}) {
  return (
    <RadioGroupCardItem
      value={value}
      className="flex w-full min-w-0 max-w-full items-center justify-between overflow-x-clip rounded-[8px] border px-2.5 py-2 text-left transition-colors data-[state=checked]:border-[1.5px] data-[state=checked]:border-brand-primary data-[state=checked]:bg-brand-primary/[0.05] data-[state=unchecked]:border-[#e1e3e8] data-[state=unchecked]:bg-[#f9fafc] data-[state=unchecked]:hover:bg-[#f4f7fb]"
    >
      <div className="flex min-w-0 items-center gap-2">
        {!hideAvatar ? (
          logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              className="h-7 w-7 shrink-0 rounded-[6px] object-cover"
            />
          ) : (
            <div className="h-7 w-7 shrink-0 rounded-[6px] bg-[#d9d9d9]" />
          )
        ) : null}
        <div>
          <p className="min-w-0 break-words text-[12px] font-medium leading-tight text-[#010a04] [overflow-wrap:anywhere] sm:text-[13px]">
            {title}
          </p>
          {subtitle ? (
            <p className="mt-0.5 min-w-0 break-words text-[11px] leading-tight text-[#010a04]/70 [overflow-wrap:anywhere]">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-black/15 transition-colors group-data-[state=checked]:border-brand-primary">
        <span className="h-2 w-2 rounded-full bg-transparent transition-colors group-data-[state=checked]:bg-brand-primary" />
      </span>
    </RadioGroupCardItem>
  );
}

export function SponsorTab({ form, sponsors, update, loading = false }: SponsorTabProps) {
  const { t } = useTranslation();
  const activeSponsors = sponsors.filter((s) => s.status === "active");

  return (
    <div className="flex min-h-0 max-w-full flex-col gap-2 overflow-x-clip">
      <div className="shrink-0 space-y-0.5">
        <h3 className={modalLabelClass}>{t("tournaments.selectSponsor")}</h3>
        <p className={modalMetaTextClass}>{t("tournaments.selectSponsorHint")}</p>
      </div>

      {!form.club ? (
        <div
          className="shrink-0 break-words rounded-[8px] border border-black/12 bg-black/[0.04] px-2.5 py-2 text-[11px] font-semibold leading-snug text-[#010a04] [overflow-wrap:anywhere] sm:text-[12px]"
          role="status"
        >
          {t("tournaments.selectClubFirst")}
        </div>
      ) : loading ? (
        <div className="flex shrink-0 justify-center py-4">
          <InlineLoader />
        </div>
      ) : (
        <RadioGroup
          className="gap-1.5"
          value={form.sponsor ?? NO_SPONSOR_VALUE}
          onValueChange={(v) =>
            update({ sponsor: v === NO_SPONSOR_VALUE ? null : v })
          }
        >
          <SponsorCard
            value={NO_SPONSOR_VALUE}
            title={t("tournaments.noSponsor")}
            hideAvatar
          />

          {activeSponsors.map((sponsor) => (
            <SponsorCard
              key={sponsor.id}
              value={sponsor.id}
              title={sponsor.name}
              subtitle={
                sponsor.description?.trim() || t("tournaments.officialSponsor")
              }
              logoUrl={sponsor.logoUrl}
            />
          ))}
        </RadioGroup>
      )}
    </div>
  );
}
