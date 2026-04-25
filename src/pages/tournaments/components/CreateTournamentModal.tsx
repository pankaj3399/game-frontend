import { useTranslation } from "react-i18next";
import { useAdminClubs } from "@/pages/clubs/hooks";
import { BasicInfoTab } from "@/pages/tournaments/components/create-modal/BasicInfoTab";
import { DetailsTab } from "@/pages/tournaments/components/create-modal/DetailsTab";
import { SponsorTab } from "@/pages/tournaments/components/create-modal/SponsorTab";
import { useTournamentActions } from "@/pages/tournaments/components/create-modal/hooks/useTournamentActions";
import { useTournamentForm } from "@/pages/tournaments/components/create-modal/hooks/useTournamentForm";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import InlineLoader from "@/components/shared/InlineLoader";

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

  const {
    form,
    initialForm,
    sponsors,
    isSponsorsLoading,
    isEditMode,
    validTournamentId,
    originalTournamentStatus,
    isTournamentLoading,
    draftValidationError,
    publishValidationError,
    update,
  } = useTournamentForm({ mode, tournamentId, open });

  const basicInfoFormScopeKey = validTournamentId ?? "create";

  const isEditingPublishedTournament =
    isEditMode && originalTournamentStatus === "active";

  const {
    isMutating,
    isPublishing,
    isSavingDraft,
    handleClose,
    handleSaveDraft,
    handlePublish,
  } =
    useTournamentActions({
      form,
      initialForm,
      validTournamentId,
      originalTournamentStatus,
      onOpenChange,
      t,
    });

  if (isEditMode && isTournamentLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex min-h-[320px] items-center justify-center">
          <InlineLoader />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        key={`${mode}-${tournamentId ?? "create"}`}
        className="max-h-[calc(100dvh-16px)] max-w-[min(100vw-1rem,390px)] min-w-0 gap-0 overflow-x-clip overflow-y-auto rounded-[12px] border border-brand-primary/20 px-2.5 py-2.5 shadow-sm shadow-brand-primary/15 sm:max-h-[calc(100dvh-24px)] sm:max-w-[min(100vw-2rem,515px)] sm:px-[15px] sm:py-5 [&>*]:min-w-0"
        showCloseButton
      >
        <DialogHeader className="min-w-0 max-w-full pb-0 pr-7 sm:pr-0">
          <DialogTitle className="min-w-0 max-w-full break-words text-[21px] font-semibold text-foreground">
            {isEditMode
              ? t("tournaments.editTournamentInfo")
              : t("tournaments.createNew")}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full min-w-0 max-w-full overflow-x-clip">
          <TabsList className="mt-3 w-full min-w-0 max-w-full bg-brand-primary/10 sm:mt-[18px] sm:w-fit">
            <TabsTrigger value="basic">
              {t("tournaments.tabBasicInfo")}
            </TabsTrigger>
            <TabsTrigger value="details">
              {t("tournaments.tabDetails")}
            </TabsTrigger>
            <TabsTrigger value="sponsor">
              {t("tournaments.tabSponsor")}
            </TabsTrigger>
          </TabsList>

          <div className="min-w-0 max-w-full overflow-x-clip py-3 sm:py-5">
            <TabsContent value="basic" forceMount className="data-[state=inactive]:hidden">
              <BasicInfoTab
                form={form}
                clubs={clubs}
                update={update}
                allowPastDates={isEditMode}
                formScopeKey={basicInfoFormScopeKey}
              />
            </TabsContent>
            <TabsContent value="details" forceMount className="data-[state=inactive]:hidden">
              <DetailsTab form={form} update={update} formScopeKey={basicInfoFormScopeKey} />
            </TabsContent>
            <TabsContent value="sponsor" forceMount className="data-[state=inactive]:hidden">
              <SponsorTab
                form={form}
                sponsors={sponsors}
                update={update}
                loading={isSponsorsLoading}
              />
            </TabsContent>
          </div>

          <div className="flex min-w-0 max-w-full flex-col gap-2.5 overflow-x-clip sm:gap-3 sm:flex-row">
            <Button
              className="w-full min-w-0 bg-brand-primary text-white shadow-sm shadow-brand-primary/20 hover:bg-brand-primary-hover focus-visible:ring-brand-primary/40 sm:flex-1"
              onClick={handlePublish}
              disabled={isPublishing || Boolean(publishValidationError)}
            >
              {isPublishing ? (
                <InlineLoader size="sm" />
              ) : (
                isEditingPublishedTournament
                  ? t("settings.saveChanges")
                  : t("tournaments.publish")
              )}
            </Button>

            <Button
              className="w-full min-w-0 bg-brand-accent text-brand-black shadow-sm hover:bg-brand-accent-hover focus-visible:ring-brand-primary/30 sm:flex-1"
              onClick={handleSaveDraft}
              disabled={isSavingDraft || Boolean(draftValidationError)}
            >
              {isSavingDraft ? (
                <InlineLoader size="sm" />
              ) : isEditingPublishedTournament ? (
                t("tournaments.saveAsDraft")
              ) : isEditMode ? (
                t("settings.saveChanges")
              ) : (
                t("tournaments.saveDraft")
              )}
            </Button>

            <Button
              variant="outline"
              className="w-full min-w-0 border-brand-primary/25 hover:bg-brand-primary/5 hover:text-brand-primary sm:flex-1"
              onClick={() => handleClose(false)}
              disabled={isMutating}
            >
              {t("tournaments.cancel")}
            </Button>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
