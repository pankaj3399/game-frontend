import {  useState } from "react";
import { useTranslation } from "react-i18next";
import { isValid, parseISO } from "date-fns";
import {
  useAdminClubs,
  useClubSponsors,
  useCreateTournament,
  usePublishTournament,
  useTournamentById,
  useUpdateTournament,
} from "@/hooks";
import type { CreateTournamentInput } from "@/hooks/tournament";
import { BasicInfoTab } from "@/components/tournaments/create-modal/BasicInfoTab";
import { DetailsTab } from "@/components/tournaments/create-modal/DetailsTab";
import { SponsorTab } from "@/components/tournaments/create-modal/SponsorTab";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import InlineLoader from "@/components/shared/InlineLoader";
import { getErrorMessage } from "@/lib/errors";
import { toast } from "sonner";

const emptyForm: CreateTournamentInput = {
  club: "",
  name: "",
  status: "draft",
  sponsorId: null,
  date: null,
  startTime: null,
  endTime: null,
  playMode: "1set",
  tournamentMode: "singleDay",
  externalFee: 0,
  minMember: 5,
  maxMember: 8,
  playTime: "30 Min",
  pauseTime: "5 Minutes",
  foodInfo: "",
  descriptionInfo: "",
  numberOfRounds: 1,
};

interface CreateTournamentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "create" | "edit";
  tournamentId?: string | null;
}

export function CreateTournamentModal({
  open,
  onOpenChange,
  mode = "create",
  tournamentId = null,
}: CreateTournamentModalProps) {
  const { t } = useTranslation();
  const { data: adminClubsData } = useAdminClubs();
  const clubs = adminClubsData?.clubs ?? [];
  const isEditMode = mode === "edit";

  const [formUpdates, setFormUpdates] = useState<Partial<CreateTournamentInput> | null>(null);
  const [activeTab, setActiveTab] = useState("basic");

  const createTournament = useCreateTournament();
  const updateTournament = useUpdateTournament();
  const publishTournament = usePublishTournament();
  const { data: tournamentData, isLoading: isTournamentLoading } = useTournamentById(
    isEditMode ? tournamentId : null,
    Boolean(isEditMode && tournamentId && open)
  );
  const isMutating =
    createTournament.isPending || updateTournament.isPending || publishTournament.isPending;

  let initialEditForm: CreateTournamentInput | null = null;
  if (isEditMode && tournamentData?.tournament) {
    const tournament = tournamentData.tournament;
    const dateStr = tournament.date
      ? (() => {
          try {
            return isValid(parseISO(tournament.date))
              ? tournament.date.slice(0, 10)
              : tournament.date;
          } catch {
            return tournament.date;
          }
        })()
      : null;

    initialEditForm = {
      club: tournament.club?.id ?? "",
      name: tournament.name ?? "",
      status: "draft",
      sponsorId: tournament.sponsor?.id ?? null,
      logo: tournament.logo ?? null,
      date: dateStr,
      startTime: tournament.startTime ?? null,
      endTime: tournament.endTime ?? null,
      playMode: tournament.playMode ?? "1set",
      tournamentMode: (tournament.tournamentMode as "singleDay" | "period") ?? "singleDay",
      externalFee: tournament.externalFee ?? 0,
      minMember: tournament.minMember ?? 1,
      maxMember: tournament.maxMember ?? 1,
      playTime: tournament.playTime ?? "30 Min",
      pauseTime: tournament.pauseTime ?? "5 Minutes",
      courts: tournament.courts?.map((court) => court.id) ?? [],
      foodInfo: tournament.foodInfo ?? "",
      descriptionInfo: tournament.descriptionInfo ?? "",
      numberOfRounds: tournament.numberOfRounds ?? 1,
      roundTimings:
        tournament.roundTimings?.map((timing) => ({
          startDate: timing.startDate ?? undefined,
          endDate: timing.endDate ?? undefined,
        })) ?? [],
    };
  }

  const baseForm = initialEditForm ?? emptyForm;
  const form: CreateTournamentInput = { ...baseForm, ...(formUpdates ?? {}) };
  const { data: sponsorsData } = useClubSponsors(form.club || null);
  const sponsors = sponsorsData?.sponsors ?? [];

  const update = (updates: Partial<CreateTournamentInput>) => {
    setFormUpdates((prev) => ({ ...(prev ?? {}), ...updates }));
  };

  const resetForm = () => {
    setFormUpdates(null);
    setActiveTab("basic");
  };

  const handleClose = (open: boolean) => {
    if (!open) resetForm();
    onOpenChange(open);
  };

  const formatTimeForBackend = (value: string | null): string | null => {
    if (!value) return null;
    if (/^\d{1,2}:\d{2}$/.test(value)) return value;
    const match = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (match) {
      let h = parseInt(match[1], 10);
      const m = match[2];
      if (match[3]?.toUpperCase() === "PM" && h < 12) h += 12;
      if (match[3]?.toUpperCase() === "AM" && h === 12) h = 0;
      return `${String(h).padStart(2, "0")}:${m}`;
    }
    return null;
  };

  const buildPayload = (status: "draft" | "active") => {
    const dateVal = form.date;
    let dateIso: string | null = null;
    if (dateVal) {
      try {
        const parsed = typeof dateVal === "string" ? parseISO(dateVal) : new Date(dateVal);
        if (isValid(parsed)) {
          dateIso = new Date(
            Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
          ).toISOString();
        }
      } catch {
        // ignore
      }
    }

    return {
      ...form,
      status,
      club: form.club,
      name: form.name.trim(),
      date: dateIso,
      startTime: formatTimeForBackend(form.startTime ?? null),
      endTime: formatTimeForBackend(form.endTime ?? null),
      sponsorId: form.sponsorId || null,
      foodInfo: form.foodInfo ?? "",
      descriptionInfo: form.descriptionInfo ?? "",
      externalFee: Number(form.externalFee) || 0,
      minMember: Number(form.minMember) || 1,
      maxMember: Number(form.maxMember) || 1,
      numberOfRounds: Number(form.numberOfRounds) || 1,
      roundTimings: form.roundTimings ?? [],
    };
  };

  const handleSaveDraft = async () => {
    if (!form.club || !form.name.trim()) {
      toast.error(t("tournaments.requiredNameAndClub"));
      return;
    }
    try {
      const payload = buildPayload("draft");
      if (isEditMode && tournamentId) {
        await updateTournament.mutateAsync({ id: tournamentId, data: payload });
      } else {
        await createTournament.mutateAsync(payload);
      }
      toast.success(t("tournaments.draftSaved"));
      handleClose(false);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) ?? t("tournaments.saveError"));
    }
  };

  const handlePublish = async () => {
    if (!form.club || !form.name.trim()) {
      toast.error(t("tournaments.requiredNameAndClub"));
      return;
    }
    if (form.tournamentMode === "singleDay" && (!form.date || !form.startTime || !form.endTime)) {
      toast.error(t("tournaments.requiredDateAndTime"));
      return;
    }
    if (form.tournamentMode === "singleDay" && form.date && form.startTime && form.endTime) {
      const normStart = formatTimeForBackend(form.startTime);
      const normEnd = formatTimeForBackend(form.endTime);
      if (normStart === null || normEnd === null) {
        toast.error(t("tournaments.invalidTimeRange"));
        return;
      }
      if (normEnd <= normStart) {
        toast.error(t("tournaments.invalidTimeRange"));
        return;
      }
    }
    if (!form.foodInfo?.trim()) {
      toast.error(t("tournaments.requiredFoodInfo"));
      return;
    }
    if (!form.descriptionInfo?.trim()) {
      toast.error(t("tournaments.requiredDescription"));
      return;
    }
    if(form.minMember && form.maxMember && form.minMember > form.maxMember) {
      toast.error(t("tournaments.invalidMemberRange"));
      return;
    }
    try {
      const payload = buildPayload("active");
      if (isEditMode && tournamentId) {
        await publishTournament.mutateAsync({ id: tournamentId });
      } else {
        await createTournament.mutateAsync(payload);
      }
      toast.success(t("tournaments.published"));
      handleClose(false);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) ?? t("tournaments.publishError"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-[720px] max-h-[90vh] overflow-y-auto gap-0 rounded-xl border border-[#e5e7eb] p-0 shadow-xl [&_[aria-label='Close']]:right-4 [&_[aria-label='Close']]:top-4 [&_[aria-label='Close']]:h-7 [&_[aria-label='Close']]:w-7 [&_[aria-label='Close']]:text-[#6b7280] [&_[aria-label='Close']]:hover:bg-transparent [&_[aria-label='Close']]:hover:text-[#374151]"
        showCloseButton={true}
      >
        <DialogHeader className="px-6 pt-5 pb-0">
          <DialogTitle className="text-[24px] font-semibold tracking-[-0.01em]">
            {isEditMode ? t("tournaments.editTournamentInfo") : t("tournaments.createNew")}
          </DialogTitle>
        </DialogHeader>

        {isEditMode && isTournamentLoading ? (
          <div className="flex min-h-[320px] items-center justify-center px-6 py-8">
            <InlineLoader />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mx-6 mt-3 h-auto w-fit rounded-md bg-[#f2f3f5] p-1">
            <TabsTrigger
              value="basic"
              className="h-8 rounded-md px-4 text-[13px] font-medium text-[#6b7280] data-[state=active]:bg-white data-[state=active]:text-[#111827] data-[state=active]:shadow-sm"
            >
              {t("tournaments.tabBasicInfo")}
            </TabsTrigger>
            <TabsTrigger
              value="details"
              className="h-8 rounded-md px-4 text-[13px] font-medium text-[#6b7280] data-[state=active]:bg-white data-[state=active]:text-[#111827] data-[state=active]:shadow-sm"
            >
              {t("tournaments.tabDetails")}
            </TabsTrigger>
            <TabsTrigger
              value="sponsor"
              className="h-8 rounded-md px-4 text-[13px] font-medium text-[#6b7280] data-[state=active]:bg-white data-[state=active]:text-[#111827] data-[state=active]:shadow-sm"
            >
              {t("tournaments.tabSponsor")}
            </TabsTrigger>
          </TabsList>

          <div className="px-6 py-4">
            <BasicInfoTab form={form} clubs={clubs} update={update} />
            <DetailsTab form={form} update={update} />
            <SponsorTab form={form} sponsors={sponsors} update={update} />
          </div>

          <div className="flex items-center gap-3 border-t border-[#e5e7eb] px-6 py-4">
            <Button
              variant="outline"
              onClick={() => handleClose(false)}
              className="h-11 flex-1 rounded-lg border-[#e5e7eb] text-[15px] font-medium text-[#374151] hover:bg-[#f9fafb]"
              disabled={isMutating}
            >
              {t("tournaments.cancel")}
            </Button>
            <Button
              className="h-11 flex-1 rounded-lg border-0 bg-[#f4c542] text-[15px] font-semibold text-[#1f2937] hover:bg-[#e7b937]"
              onClick={handleSaveDraft}
              disabled={isMutating || !form.club || !form.name.trim()}
            >
              {isMutating ? (
                <InlineLoader size="sm" />
              ) : (
                isEditMode ? t("settings.saveChanges") : t("tournaments.saveDraft")
              )}
            </Button>
            <Button
              className="h-11 flex-1 rounded-lg bg-[#0a9f43] text-[15px] font-semibold text-white hover:bg-[#088a3a]"
              onClick={handlePublish}
              disabled={isMutating || !form.club || !form.name.trim()}
            >
              {isMutating ? (
                <InlineLoader size="sm" />
              ) : (
                t("tournaments.publish")
              )}
            </Button>
          </div>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
