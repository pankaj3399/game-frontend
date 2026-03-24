import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAdminClubs } from "@/pages/clubs/hooks";
import { useClubSponsors } from "@/pages/sponsors/hooks";
import type { TournamentDetail, UpdateTournamentInput } from "@/models/tournament/types";
import { useUpdateTournament } from "@/pages/tournaments/hooks/tournament";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import InlineLoader from "@/components/shared/InlineLoader";
import { getErrorMessage } from "@/lib/errors";

interface EditTournamentInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournament: TournamentDetail;
}

function SponsorIndicator({ selected }: { selected: boolean }) {
  return (
    <span
      className={`flex h-5 w-5 items-center justify-center rounded-full border transition ${
        selected ? "border-[#0a6925]" : "border-[rgba(1,10,4,0.15)]"
      }`}
      aria-hidden="true"
    >
      <span className={`h-2.5 w-2.5 rounded-full ${selected ? "bg-[#0a6925]" : "bg-transparent"}`} />
    </span>
  );
}

function SponsorOption({
  title,
  subtitle,
  selected,
  onClick,
  logoUrl,
  compact = false,
  disabled = false,
}: {
  title: string;
  subtitle?: string;
  selected: boolean;
  onClick: () => void;
  logoUrl?: string | null;
  compact?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      aria-disabled={disabled}
      onClick={onClick}
      className={`w-full rounded-[12px] border text-left transition ${
        selected
          ? "border-[1.5px] border-[#067429] bg-[rgba(10,105,37,0.05)]"
          : "border border-[#e1e3e8] bg-[#f9fafc]"
      } ${disabled ? "cursor-not-allowed opacity-[0.92]" : ""} ${compact ? "h-[50px] px-[13px] py-3" : "px-[13px] py-3"}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {!compact ? (
            <div className="h-[45px] w-[45px] shrink-0 overflow-hidden rounded-[8px] bg-[#d9d9d9]">
              {logoUrl ? <img src={logoUrl} alt="" className="h-full w-full object-cover" /> : null}
            </div>
          ) : null}
          <div className="min-w-0">
            <p className="truncate text-[16px] font-medium leading-none text-[#010a04]">{title}</p>
            {subtitle ? <p className="mt-[7px] truncate text-[14px] leading-none text-[#010a04]/70">{subtitle}</p> : null}
          </div>
        </div>
        <SponsorIndicator selected={selected} />
      </div>
    </button>
  );
}

export function EditTournamentInfoModal({ open, onOpenChange, tournament }: EditTournamentInfoModalProps) {
  const { t } = useTranslation();
  const updateTournament = useUpdateTournament();
  const { data: adminClubsData } = useAdminClubs(open);

  const initialSelection = {
    clubId: tournament.club?.id ?? "",
    sponsorId: tournament.sponsor?.id ?? "",
  };

  const [selection, setSelection] = useState<{
    clubId: string;
    sponsorId: string;
  } | null>(null);

  const selectedClubId = selection?.clubId ?? initialSelection.clubId;
  const selectedSponsorId = selection?.sponsorId ?? initialSelection.sponsorId;

  const clubs = adminClubsData?.clubs ?? [];
  const clubsWithFallback = !selectedClubId
    ? clubs
    : clubs.some((club) => club.id === selectedClubId)
      ? clubs
      : [{ id: selectedClubId, name: tournament.club?.name ?? t("tournaments.unknownClub"), courtCount: 0 }, ...clubs];

  const { data: sponsorsData, isLoading: isSponsorsLoading } = useClubSponsors(selectedClubId || null);
  const sponsors = sponsorsData?.sponsors ?? [];
  const activeSponsors = sponsors.filter((sponsor) => sponsor.status === "active");
  const selectedInActiveSponsors =
    Boolean(selectedSponsorId) && activeSponsors.some((s) => s.id === selectedSponsorId);
  const sponsorFromList = sponsors.find((s) => s.id === selectedSponsorId);
  const sponsorFromTournament =
    tournament.sponsor?.id === selectedSponsorId ? tournament.sponsor : null;
  const fallbackSponsor =
    !isSponsorsLoading &&
    selectedClubId &&
    selectedSponsorId &&
    !selectedInActiveSponsors &&
    (sponsorFromList || sponsorFromTournament)
      ? {
          id: selectedSponsorId,
          name: sponsorFromList?.name ?? sponsorFromTournament?.name ?? t("tournaments.unknownSponsor"),
          logoUrl: sponsorFromList?.logoUrl ?? sponsorFromTournament?.logoUrl ?? null,
        }
      : null;

  const hasChanges =
    selectedClubId !== initialSelection.clubId || selectedSponsorId !== initialSelection.sponsorId;

  const isMutating = updateTournament.isPending;

  const resetSelection = () => {
    setSelection(null);
  };

  const closeModal = () => {
    resetSelection();
    onOpenChange(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isMutating) {
      return;
    }
    if (!nextOpen) {
      resetSelection();
    }
    onOpenChange(nextOpen);
  };

  const handleClubChange = (clubId: string) => {
    setSelection({ clubId, sponsorId: "" });
  };

  const handleSave = async () => {
    if (isMutating) return;

    if (!hasChanges) {
      return;
    }

    const payload: UpdateTournamentInput = {
      club: selectedClubId,
      sponsor: selectedSponsorId || null,
    };

    try {
      await updateTournament.mutateAsync({ id: tournament.id, data: payload });
      toast.success(t("settings.saveSuccess"));
      closeModal();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) ?? t("tournaments.saveError"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-[513px] gap-0 overflow-hidden rounded-[12px] border border-[rgba(1,10,4,0.08)] bg-white p-0 shadow-[0px_3px_15px_0px_rgba(0,0,0,0.06)] [&_[aria-label='Close']]:right-4 [&_[aria-label='Close']]:top-[18px] [&_[aria-label='Close']]:text-[#010a04]/70"
        showCloseButton={true}
      >
        <div className="px-[15px] pt-5">
          <DialogHeader className="pb-[18px]">
            <DialogTitle className="text-[21px] font-semibold leading-none text-[#010a04]">
              {t("tournaments.editTournamentInfo")}
            </DialogTitle>
          </DialogHeader>
        </div>
        <div className="h-px w-full bg-[#010a04]/10" />

        <div className="space-y-[25px] px-[15px] py-5">
          <div className="space-y-3">
            <div className="space-y-1.5 text-[#010a04]">
              <p className="text-[16px] font-medium leading-none">{t("tournaments.selectClub")}</p>
              <p className="text-[14px] leading-[1.4] text-[#010a04]/60">{t("tournaments.editClubHint")}</p>
            </div>

            <Select value={selectedClubId} onValueChange={handleClubChange}>
              <SelectTrigger className="h-[46px] w-full rounded-[12px] border-[#e1e3e8] bg-[#f9fafc] px-[15px] text-[16px] font-medium text-[#010a04]">
                <SelectValue placeholder={t("tournaments.chooseClub")} />
              </SelectTrigger>
              <SelectContent>
                {clubsWithFallback.map((club) => (
                  <SelectItem key={club.id} value={club.id}>
                    {club.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="h-px w-full bg-[#010a04]/10" />

          <div className="space-y-[14px]">
            <div className="space-y-1 text-[#010a04]">
              <p className="text-[18px] font-semibold leading-[1.4]">{t("tournaments.selectSponsor")}</p>
              <p className="text-[14px] leading-[1.4] text-[#010a04]/60">{t("tournaments.selectSponsorHint")}</p>
            </div>

            <div className="max-h-[290px] space-y-3 overflow-y-auto pr-0.5">
              <SponsorOption
                title={t("tournaments.noSponsor")}
                selected={selectedSponsorId === ""}
                onClick={() => setSelection((prev) => ({ ...(prev ?? initialSelection), sponsorId: "" }))}
                compact
              />

              {isSponsorsLoading ? (
                <div className="flex h-[74px] items-center justify-center rounded-[12px] border border-[#e1e3e8] bg-[#f9fafc]">
                  <InlineLoader />
                </div>
              ) : !selectedClubId ? (
                <div className="rounded-[12px] border border-[#e1e3e8] bg-[#f9fafc] px-[13px] py-5 text-[14px] text-[#010a04]/70">
                  {t("tournaments.selectClubFirst")}
                </div>
              ) : (
                <>
                  {fallbackSponsor ? (
                    <SponsorOption
                      key={`fallback-${fallbackSponsor.id}`}
                      title={fallbackSponsor.name}
                      subtitle={t("tournaments.officialSponsor")}
                      selected
                      disabled
                      onClick={() => {}}
                      logoUrl={fallbackSponsor.logoUrl}
                    />
                  ) : null}
                  {activeSponsors.length === 0 && !fallbackSponsor ? (
                    <div className="rounded-[12px] border border-[#e1e3e8] bg-[#f9fafc] px-[13px] py-5 text-[14px] text-[#010a04]/70">
                      {t("tournaments.noSponsors")}
                    </div>
                  ) : (
                    activeSponsors.map((sponsor) => (
                      <SponsorOption
                        key={sponsor.id}
                        title={sponsor.name}
                        subtitle={
                          selectedSponsorId === sponsor.id
                            ? t("tournaments.officialSponsor")
                            : t("tournaments.statusActive")
                        }
                        selected={selectedSponsorId === sponsor.id}
                        onClick={() =>
                          setSelection((prev) => ({ ...(prev ?? initialSelection), sponsorId: sponsor.id }))
                        }
                        logoUrl={sponsor.logoUrl}
                      />
                    ))
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Button
              variant="outline"
              className="h-[38px] flex-1 rounded-[8px] border border-[rgba(0,0,0,0.15)] bg-transparent px-4 text-[16px] font-medium leading-[20px] text-[#010a04] hover:bg-[#f8f8f8]"
              onClick={() => handleOpenChange(false)}
              disabled={isMutating}
            >
              {t("tournaments.cancel")}
            </Button>
            <Button
              className="h-[38px] flex-1 rounded-[8px] bg-gradient-to-r from-[#0a6925] via-[#0c7b2c] to-[#0f8d33] px-4 text-[16px] font-medium leading-[20px] text-white hover:brightness-95"
              onClick={handleSave}
              disabled={!hasChanges || isMutating}
            >
              {isMutating ? t("common.loading") : t("settings.saveChanges")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
