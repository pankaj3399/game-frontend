import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LocationSearchInput } from "./LocationSearchInput";
import InlineLoader from "@/components/shared/InlineLoader";
import { useAddEditClubForm } from "./add-edit-club-modal/useAddEditClubForm";
import { ClubCourtsEditor } from "./add-edit-club-modal/ClubCourtsEditor";

interface AddEditClubModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editClubId: string | null;
}

export function AddEditClubModal({
  open,
  onOpenChange,
  editClubId,
}: AddEditClubModalProps) {
  const { t } = useTranslation();
  const {
    isEdit,
    loadingClub,
    isPending,
    currentForm,
    setField,
    handleAddCourt,
    handleRemoveCourt,
    handleCourtChange,
    handleLocationSelect,
    handleAddressChange,
    handleSubmit,
    handleDialogOpenChange,
    close,
    courtTypes,
    courtPlacements,
  } = useAddEditClubForm({ editClubId, onOpenChange });

  return (
    <Dialog
      open={open}
      onOpenChange={handleDialogOpenChange}
    >
      <DialogContent
        className="sm:max-w-xl"
        showCloseButton={true}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{t("settings.adminClubsModalTitle")}</DialogTitle>
        </DialogHeader>

        {isEdit && loadingClub ? (
          <div className="flex items-center justify-center py-8">
            <InlineLoader />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="club-name" className="text-xs font-medium uppercase text-muted-foreground">
                {t("settings.adminClubsClubName")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="club-name"
                placeholder={t("settings.adminClubsClubNamePlaceholder")}
                value={currentForm.name}
                onChange={(event) => setField("name", event.target.value)}
                className="h-10"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="club-website" className="text-xs font-medium uppercase text-muted-foreground">
                {t("settings.adminClubsWebsite")} <span className="text-muted-foreground/70">(optional)</span>
              </Label>
              <Input
                id="club-website"
                placeholder={t("settings.adminClubsWebsitePlaceholder")}
                value={currentForm.website}
                onChange={(event) => setField("website", event.target.value)}
                className="h-10"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="club-booking-url" className="text-xs font-medium uppercase text-muted-foreground">
                {t("settings.adminClubsBookingUrl")} <span className="text-muted-foreground/70">(optional)</span>
              </Label>
              <Input
                id="club-booking-url"
                placeholder={t("settings.adminClubsBookingUrlPlaceholder")}
                value={currentForm.bookingSystemUrl}
                onChange={(event) => setField("bookingSystemUrl", event.target.value)}
                className="h-10"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="club-address" className="text-xs font-medium uppercase text-muted-foreground">
                {t("settings.adminClubsAddress")} <span className="text-destructive">*</span>
              </Label>
              <LocationSearchInput
                id="club-address"
                value={currentForm.address}
                onChange={handleAddressChange}
                onSelect={handleLocationSelect}
                placeholder={t("settings.adminClubsLocationSearchPlaceholder")}
                searchingLabel={t("settings.adminClubsLocationSearching")}
              />
            </div>
            <ClubCourtsEditor
              courts={currentForm.courts}
              courtTypes={courtTypes}
              courtPlacements={courtPlacements}
              onAddCourt={handleAddCourt}
              onRemoveCourt={handleRemoveCourt}
              onCourtChange={handleCourtChange}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={close}
              >
                {t("settings.adminClubsCancel")}
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-brand-primary text-white hover:bg-brand-primary-hover"
              >
                {isPending ? (
                  <InlineLoader size="sm" />
                ) : (
                  t("settings.adminClubsSave")
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
