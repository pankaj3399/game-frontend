import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAdminClubs } from "@/pages/clubs/hooks";
import { useClubSponsors } from "@/pages/sponsors/hooks";
import {
  useCreateTournament,
  usePublishTournament,
  useTournamentById,
  useUpdateTournament,
} from "@/pages/tournaments/hooks/tournament";
import type { CreateTournamentInput } from "@/models/tournament/types";
import { BasicInfoTab } from "@/pages/tournaments/components/create-modal/BasicInfoTab";
import { DetailsTab } from "@/pages/tournaments/components/create-modal/DetailsTab";
import { SponsorTab } from "@/pages/tournaments/components/create-modal/SponsorTab";
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
import {
  buildDraftUpdatePayload,
  buildTournamentPayload,
  DEFAULT_CREATE_TOURNAMENT_FORM,
  getDraftValidationError,
  getPublishValidationError,
  mapTournamentDetailToForm,
} from "@/lib/tournament/form";
import { toast } from "sonner";

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

  const initialEditForm = isEditMode && tournamentData?.tournament
    ? mapTournamentDetailToForm(tournamentData.tournament)
    : null;
  const baseForm = initialEditForm ?? DEFAULT_CREATE_TOURNAMENT_FORM;
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

  const handleSaveDraft = async () => {
    const validationError = getDraftValidationError(form);
    if (validationError) {
      toast.error(t(validationError));
      return;
    }
    try {
      const payload = buildTournamentPayload(form, "draft");
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
    const validationError = getPublishValidationError(form);
    if (validationError) {
      toast.error(t(validationError));
      return;
    }
    try {
      const payload = buildTournamentPayload(form, "active");
      if (isEditMode && tournamentId) {
        const draftPayload = buildDraftUpdatePayload(form);
        await updateTournament.mutateAsync({ id: tournamentId, data: draftPayload });
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
