import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Circle } from "@/icons/figma-icons";
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
      variant="outline"
      onClick={onClick}
      className={`h-auto w-full justify-between rounded-lg p-3 text-left transition ${
        selected
          ? "border-brand-primary bg-brand-primary/5"
          : "border-border bg-background hover:bg-muted/60"
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
          {logoUrl ? <img src={logoUrl} alt={title} className="h-full w-full object-cover" /> : null}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium leading-tight text-foreground">{title}</p>
          {subtitle ? <p className="mt-0.5 truncate text-xs leading-tight text-muted-foreground">{subtitle}</p> : null}
        </div>
      </div>
      {selected ? (
        <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-primary" />
      ) : (
        <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
      )}
    </Button>
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

  const hasChanges = selectedClubId !== initialSelection.clubId || selectedSponsorId !== initialSelection.sponsorId;

  const handleClubChange = (clubId: string) => {
    setSelection({ clubId, sponsorId: "" });
  };

  const handleSave = async () => {

    if (updateTournament.isPending) return;

    if (!hasChanges || !selectedClubId) {
      return;
    }

    const payload: UpdateTournamentInput = {
      club: selectedClubId,
      sponsor: selectedSponsorId || null,
    };

    try {
      await updateTournament.mutateAsync({ id: tournament.id, data: payload });
      toast.success(t("settings.saveSuccess"));
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) ?? t("tournaments.saveError"));
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setSelection(null);
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent
        className="max-w-2xl gap-0 rounded-xl border border-border p-0 shadow-xl [&_[aria-label='Close']]:right-4 [&_[aria-label='Close']]:top-4 [&_[aria-label='Close']]:text-muted-foreground"
        showCloseButton={true}
      >
        <DialogHeader className="border-b border-border px-6 py-5">
          <DialogTitle className="text-3xl font-semibold tracking-tight text-foreground">
            {t("tournaments.editTournamentInfo")}
          </DialogTitle>
          <DialogDescription className="pt-1 text-sm text-muted-foreground">
            {tournament.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-6 py-5">
          <div className="space-y-5 rounded-xl border border-border bg-muted/20 p-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">{t("tournaments.selectClub")}</h3>
              <DialogDescription className="mt-1 max-w-[560px] text-xs leading-relaxed text-muted-foreground">
                {t("tournaments.editClubHint")}
              </DialogDescription>
              <Select value={selectedClubId} onValueChange={handleClubChange}>
                <SelectTrigger className="mt-2 h-11 w-full border-border bg-background text-foreground">
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
          </div>

          <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">{t("tournaments.selectSponsor")}</h3>
              <p className="mt-1 max-w-[560px] text-xs leading-relaxed text-muted-foreground">{t("tournaments.selectSponsorHint")}</p>
            </div>
            <div
              className={`max-h-[280px] space-y-2 overflow-y-auto rounded-lg border border-border bg-background p-2 ${
                !selectedClubId ? "pointer-events-none opacity-50" : ""
                }`}
            >
              {isSponsorsLoading ? (
                <div className="flex min-h-24 items-center justify-center">
                  <InlineLoader />
                </div>
              ) : (
                <>
                  <SponsorCard
                    selected={selectedSponsorId === ""}
                    title={t("tournaments.noSponsor")}
                    onClick={() =>
                      setSelection((prev) => ({ ...(prev ?? initialSelection), sponsorId: "" }))
                    }
                  />

                  {activeSponsors.length === 0 ? (
                    <p className="rounded-md px-3 py-2 text-xs text-muted-foreground">
                      {t("tournaments.noSponsors")}
                    </p>
                  ) : null}

                  {activeSponsors.map((sponsor) => (
                    <SponsorCard
                      key={sponsor.id}
                      selected={selectedSponsorId === sponsor.id}
                      title={sponsor.name}
                      subtitle={t("tournaments.statusActive")}
                      logoUrl={sponsor.logoUrl}
                      onClick={() =>
                        setSelection((prev) => ({ ...(prev ?? initialSelection), sponsorId: sponsor.id }))
                      }
                    />
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-border bg-muted/10 px-6 py-4">
          <Button
            variant="outline"
            className="h-11 flex-1 border-border text-sm font-medium"
            onClick={() => onOpenChange(false)}
            disabled={updateTournament.isPending}
          >
            {t("tournaments.cancel")}
          </Button>
          <Button
            className="h-11 flex-1 bg-brand-primary text-sm font-semibold text-brand-primary-foreground hover:bg-brand-primary-hover"
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
