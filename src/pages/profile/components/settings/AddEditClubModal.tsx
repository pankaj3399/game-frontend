import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { XIcon } from "@/icons/figma-icons";
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

  const inputClassName =
    "h-[38px] rounded-[8px] border-[#e1e3e8] bg-[#f9fafc] px-3 text-sm shadow-none placeholder:text-[#010a04]/50 focus-visible:ring-0 focus-visible:border-[#d5d8de]";
  const labelClassName = "text-xs font-medium uppercase text-[#010a04]/70";

  return (
    <Dialog
      open={open}
      onOpenChange={handleDialogOpenChange}
    >
      <DialogContent
        className="gap-0 rounded-[12px] border-[#010a04]/10 px-[15px] py-5 shadow-[0px_3px_15px_0px_rgba(0,0,0,0.06)] sm:max-w-[416px]"
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="gap-[18px]">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-[21px] font-semibold text-[#010a04]">
              {t("settings.adminClubsModalTitle")}
            </DialogTitle>
            <DialogClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6 rounded-none p-0 text-[#010a04]/80 hover:bg-transparent hover:text-[#010a04]"
                aria-label={t("common.close")}
              >
                <XIcon className="size-5" />
              </Button>
            </DialogClose>
          </div>
          <div className="h-px w-full bg-[#010a04]/10" />
        </DialogHeader>

        {isEdit && loadingClub ? (
          <div className="flex items-center justify-center py-8">
            <InlineLoader />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-[22px] flex flex-col gap-[22px]">
            <div className="grid gap-[10px]">
              <Label htmlFor="club-name" className={labelClassName}>
                {t("settings.adminClubsClubName")}
              </Label>
              <Input
                id="club-name"
                placeholder={t("settings.adminClubsClubNamePlaceholder")}
                value={currentForm.name}
                onChange={(event) => setField("name", event.target.value)}
                className={inputClassName}
              />
            </div>

            <div className="grid gap-[10px]">
              <Label htmlFor="club-website" className={labelClassName}>
                {t("settings.adminClubsWebsite")}
              </Label>
              <Input
                id="club-website"
                placeholder={t("settings.adminClubsWebsitePlaceholder")}
                value={currentForm.website}
                onChange={(event) => setField("website", event.target.value)}
                className={inputClassName}
              />
            </div>

            <div className="grid gap-[10px]">
              <Label htmlFor="club-booking-url" className={labelClassName}>
                {t("settings.adminClubsBookingUrl")}
              </Label>
              <Input
                id="club-booking-url"
                placeholder={t("settings.adminClubsBookingUrlPlaceholder")}
                value={currentForm.bookingSystemUrl}
                onChange={(event) => setField("bookingSystemUrl", event.target.value)}
                className={inputClassName}
              />
            </div>

            <div className="grid gap-[10px]">
              <Label htmlFor="club-address" className={labelClassName}>
                {t("settings.adminClubsAddress")}
              </Label>
              <LocationSearchInput
                id="club-address"
                value={currentForm.address}
                onChange={handleAddressChange}
                onSelect={handleLocationSelect}
                placeholder={t("settings.adminClubsLocationSearchPlaceholder")}
                searchingLabel={t("settings.adminClubsLocationSearching")}
                className={inputClassName}
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

            <DialogFooter className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:justify-start">
              <Button
                type="button"
                variant="outline"
                onClick={close}
                className="h-[38px] rounded-[8px] border-black/12 bg-white text-base font-medium text-[#010a04] shadow-none hover:bg-[#f9fafc]"
              >
                {t("settings.adminClubsCancel")}
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="h-[38px] rounded-[8px] bg-linear-to-r from-[#0a6925] via-[#0c7b2c] to-[#0f8d33] text-base font-medium text-white hover:opacity-95"
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
