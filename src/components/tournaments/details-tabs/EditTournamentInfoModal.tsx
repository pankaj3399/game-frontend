import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAdminClubs, useClubSponsors } from "@/hooks";
import type { TournamentDetail, UpdateTournamentInput } from "@/hooks/tournament";
import { useUpdateTournament } from "@/hooks/tournament";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import InlineLoader from "@/components/shared/InlineLoader";
import { getErrorMessage } from "@/lib/errors";

interface EditTournamentInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournament: TournamentDetail;
}

function SponsorCard({
  selected,
  title,
  subtitle,
  logoUrl,
  onClick,
}: {
  selected: boolean;
  title: string;
  subtitle?: string;
  logoUrl?: string | null;
  onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-colors ${selected
          ? "border-[#27a457] bg-[#f7fbf8] ring-1 ring-[#27a457]"
          : "border-[#e5e7eb] bg-[#f3f4f6] hover:bg-[#eef0f2]"
        }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#d8dadd]">
          {logoUrl ? <img src={logoUrl} alt={title} className="h-full w-full object-cover" /> : null}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[14px] font-medium leading-tight text-[#1f2937]">{title}</p>
          {subtitle ? <p className="mt-0.5 truncate text-[12px] leading-tight text-[#6b7280]">{subtitle}</p> : null}
        </div>
      </div>
      <span
        className={`h-4 w-4 shrink-0 rounded-full border ${selected ? "border-[#27a457] ring-4 ring-[#27a457] ring-offset-2" : "border-[#d1d5db]"
          }`}
      />
    </Button>
  );
}

export function EditTournamentInfoModal({ open, onOpenChange, tournament }: EditTournamentInfoModalProps) {
  const { t } = useTranslation();
  const updateTournament = useUpdateTournament();
  const { data: adminClubsData } = useAdminClubs(open);

  const [selectedClubId, setSelectedClubId] = useState(tournament.club?.id ?? "");
  const [selectedSponsorId, setSelectedSponsorId] = useState(tournament.sponsor?.id ?? "");

  const clubs = adminClubsData?.clubs ?? [];
  const clubsWithFallback = (() => {
    if (!selectedClubId) return clubs;
    const exists = clubs.some((club) => club.id === selectedClubId);
    if (exists) return clubs;
    return [{ id: selectedClubId, name: tournament.club?.name ?? t("tournaments.unknownClub"), courtCount: 0 }, ...clubs];
  })();

  const { data: sponsorsData, isLoading: isSponsorsLoading } = useClubSponsors(selectedClubId || null);
  const sponsors = sponsorsData?.sponsors ?? [];
  const activeSponsors = sponsors.filter((sponsor) => sponsor.status === "active");

  const hasChanges = selectedClubId !== (tournament.club?.id ?? "") || selectedSponsorId !== (tournament.sponsor?.id ?? "");

  const handleClubChange = (clubId: string) => {
    setSelectedClubId(clubId);
    if (!activeSponsors.some((s) => s.id === selectedSponsorId)) {
      setSelectedSponsorId("");
    }
  };

  const handleSave = async () => {

    if (updateTournament.isPending) return;

    if (!hasChanges || !selectedClubId) {
      return;
    }

    const payload: UpdateTournamentInput = {
      club: selectedClubId,
      sponsorId: selectedSponsorId || null,
    };

    try {
      await updateTournament.mutateAsync({ id: tournament.id, data: payload });
      toast.success(t("settings.saveSuccess"));
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) ?? t("tournaments.saveError"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[640px] gap-0 rounded-xl border border-[#e5e7eb] p-0 shadow-xl [&_[aria-label='Close']]:right-3 [&_[aria-label='Close']]:top-3 [&_[aria-label='Close']]:text-[#6b7280]"
        showCloseButton={true}
      >
        <DialogHeader className="border-b border-[#e5e7eb] px-5 pt-4 pb-3">
          <DialogTitle className="text-[30px] font-semibold tracking-[-0.01em] text-[#111827]">
            {t("tournaments.editTournamentInfo")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 px-5 py-4">
          <div>
            <h3 className="text-[15px] font-semibold text-[#111827]">{t("tournaments.selectClub")}</h3>
            <DialogDescription className="mt-1 max-w-[560px] text-xs leading-snug text-[#6b7280]">
              {t("tournaments.editClubHint")}
            </DialogDescription>
            <Select value={selectedClubId} onValueChange={handleClubChange}>
              <SelectTrigger className="mt-2 h-10 w-full border-[#d1d5db] bg-[#f9fafb] text-[#111827]">
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

          <div>
            <h3 className="text-[15px] font-semibold text-[#111827]">{t("tournaments.selectSponsor")}</h3>
            <p className="mt-1 max-w-[560px] text-xs leading-snug text-[#6b7280]">{t("tournaments.selectSponsorHint")}</p>
            <div
              className={`mt-3 max-h-[250px] space-y-2 overflow-y-auto pr-1 ${!selectedClubId ? "pointer-events-none opacity-50" : ""
                }`}
            >
              {isSponsorsLoading ? (
                <InlineLoader />
              ) : (
                <>
                  <SponsorCard
                    selected={selectedSponsorId === ""}
                    title={t("tournaments.noSponsor")}
                    onClick={() => setSelectedSponsorId("")}
                  />

                  {activeSponsors.map((sponsor) => (
                    <SponsorCard
                      key={sponsor.id}
                      selected={selectedSponsorId === sponsor.id}
                      title={sponsor.name}
                      subtitle={t("tournaments.statusActive")}
                      logoUrl={sponsor.logoUrl}
                      onClick={() => setSelectedSponsorId(sponsor.id)}
                    />
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-[#e5e7eb] px-5 py-3">
          <Button
            variant="outline"
            className="h-10 flex-1 border-[#d1d5db] text-sm font-medium text-[#374151] hover:bg-[#f9fafb]"
            onClick={() => onOpenChange(false)}
            disabled={updateTournament.isPending}
          >
            {t("tournaments.cancel")}
          </Button>
          <Button
            className="h-10 flex-1 bg-[#0b8e3f] text-sm font-semibold text-white hover:bg-[#087535]"
            onClick={handleSave}
            disabled={!hasChanges || updateTournament.isPending}
          >
            {updateTournament.isPending ? t("common.loading") : t("settings.saveChanges")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
