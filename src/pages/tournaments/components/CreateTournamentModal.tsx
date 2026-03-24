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
  };

  const closeModal = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen && isMutating) {
      return;
    }
    if (!nextOpen) {
      resetForm();
    }
    onOpenChange(nextOpen);
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
      closeModal();
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
      closeModal();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) ?? t("tournaments.publishError"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
          className="max-h-[calc(100dvh-24px)] max-w-[390px] overflow-y-auto gap-0 rounded-[12px] border border-black/10 px-3 py-3 shadow-[0px_3px_15px_0px_rgba(0,0,0,0.06)] sm:max-w-[515px] sm:px-[15px] sm:py-5 [&_[aria-label='Close']]:right-0 [&_[aria-label='Close']]:top-0 [&_[aria-label='Close']]:h-5 [&_[aria-label='Close']]:w-5 sm:[&_[aria-label='Close']]:h-6 sm:[&_[aria-label='Close']]:w-6 [&_[aria-label='Close']]:text-[#010a04] [&_[aria-label='Close']]:hover:bg-transparent [&_[aria-label='Close']]:hover:text-[#010a04]"
        showCloseButton={true}
      >
        <DialogHeader className="pb-0">
          <DialogTitle className="text-[21px] font-semibold leading-none text-[#010a04]">
            {isEditMode ? t("tournaments.editTournamentInfo") : t("tournaments.createNew")}
          </DialogTitle>
        </DialogHeader>

        {isEditMode && isTournamentLoading ? (
          <div className="flex min-h-[320px] items-center justify-center py-8">
            <InlineLoader />
          </div>
        ) : (
          <Tabs
            key={`${mode}-${tournamentId ?? "create"}-${open ? "open" : "closed"}`}
            defaultValue="basic"
            className="w-full"
          >
          <TabsList className="mt-[18px] h-auto w-full rounded-[10px] bg-black/5 p-1 sm:w-fit">
            <TabsTrigger
              value="basic"
              className="h-[30px] flex-1 rounded-[8px] px-[15px] text-[14px] font-medium text-[#010a04] data-[state=active]:bg-white data-[state=active]:text-[#010a04] data-[state=active]:shadow-[0px_0px_4px_0px_rgba(0,0,0,0.04),0px_4px_8px_0px_rgba(0,0,0,0.06)] data-[state=inactive]:opacity-70 sm:flex-none"
            >
              {t("tournaments.tabBasicInfo")}
            </TabsTrigger>
            <TabsTrigger
              value="details"
              className="h-[30px] flex-1 rounded-[8px] px-[15px] text-[14px] font-medium text-[#010a04] data-[state=active]:bg-white data-[state=active]:text-[#010a04] data-[state=active]:shadow-[0px_0px_4px_0px_rgba(0,0,0,0.04),0px_4px_8px_0px_rgba(0,0,0,0.06)] data-[state=inactive]:opacity-70 sm:flex-none"
            >
              {t("tournaments.tabDetails")}
            </TabsTrigger>
            <TabsTrigger
              value="sponsor"
              className="h-[30px] flex-1 rounded-[8px] px-[15px] text-[14px] font-medium text-[#010a04] data-[state=active]:bg-white data-[state=active]:text-[#010a04] data-[state=active]:shadow-[0px_0px_4px_0px_rgba(0,0,0,0.04),0px_4px_8px_0px_rgba(0,0,0,0.06)] data-[state=inactive]:opacity-70 sm:flex-none"
            >
              {t("tournaments.tabSponsor")}
            </TabsTrigger>
          </TabsList>

          <div className="py-5">
            <BasicInfoTab form={form} clubs={clubs} update={update} />
            <DetailsTab form={form} update={update} />
            <SponsorTab form={form} sponsors={sponsors} update={update} />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              variant="outline"
              onClick={() => handleClose(false)}
              className="order-3 h-[46px] w-full rounded-[12px] border-black/12 text-[16px] font-medium text-[#010a04] hover:bg-transparent sm:order-1 sm:flex-1"
              disabled={isMutating}
            >
              {t("tournaments.cancel")}
            </Button>
            <Button
              className="order-2 h-[46px] w-full rounded-[12px] border-0 bg-[#f4c95d] text-[16px] font-medium text-black hover:bg-[#e8bb4d] sm:flex-1"
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
              className="order-1 h-[46px] w-full rounded-[12px] bg-gradient-to-r from-[#0a6925] via-[#0c7b2c] to-[#0f8d33] text-[16px] font-medium text-white hover:from-[#095f22] hover:via-[#0b7229] hover:to-[#0d812f] sm:order-3 sm:flex-1"
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
