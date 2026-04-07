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
    sponsors,
    isSponsorsLoading,
    isEditMode,
    validTournamentId,
    isTournamentLoading,
    draftValidationError,
    publishValidationError,
    update,
  } = useTournamentForm({ mode, tournamentId, open });

  const { isMutating, handleClose, handleSaveDraft, handlePublish } =
    useTournamentActions({
      form,
      validTournamentId,
      onOpenChange,
      t,
      draftValidationError,
      publishValidationError,
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
        key={`${mode}-${tournamentId ?? "create"}-${open}`}
        className="max-h-[calc(100dvh-24px)] max-w-[390px] overflow-y-auto gap-0 rounded-[12px] border border-black/10 px-3 py-3 shadow-[0px_3px_15px_0px_rgba(0,0,0,0.06)] sm:max-w-[515px] sm:px-[15px] sm:py-5"
        showCloseButton
      >
        <DialogHeader className="pb-0">
          <DialogTitle className="text-[21px] font-semibold">
            {isEditMode
              ? t("tournaments.editTournamentInfo")
              : t("tournaments.createNew")}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="mt-[18px] w-full sm:w-fit">
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

          <div className="py-5">
            <TabsContent value="basic">
              <BasicInfoTab form={form} clubs={clubs} update={update} />
            </TabsContent>
            <TabsContent value="details">
              <DetailsTab form={form} update={update} />
            </TabsContent>
            <TabsContent value="sponsor">
              <SponsorTab
                form={form}
                sponsors={sponsors}
                update={update}
                loading={isSponsorsLoading}
              />
            </TabsContent>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={isMutating}
            >
              {t("tournaments.cancel")}
            </Button>

            <Button
              onClick={handleSaveDraft}
              disabled={isMutating || Boolean(draftValidationError)}
            >
              {isMutating ? (
                <InlineLoader size="sm" />
              ) : isEditMode ? (
                t("settings.saveChanges")
              ) : (
                t("tournaments.saveDraft")
              )}
            </Button>

            <Button
              onClick={handlePublish}
              disabled={isMutating || Boolean(publishValidationError)}
            >
              {isMutating ? (
                <InlineLoader size="sm" />
              ) : (
                t("tournaments.publish")
              )}
            </Button>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}