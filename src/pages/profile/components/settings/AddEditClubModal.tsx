import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Delete01Icon, Upload01Icon, XIcon } from "@/icons/figma-icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LocationSearchInput } from "./LocationSearchInput";
import InlineLoader from "@/components/shared/InlineLoader";
import { useAddEditClubForm } from "./add-edit-club-modal/useAddEditClubForm";
import { ClubCourtsEditor } from "./add-edit-club-modal/ClubCourtsEditor";
import { toast } from "sonner";
import { uploadImageFile } from "@/lib/api/uploadImage";

const MAX_CLUB_LOGO_SIZE_MB = 2;
const ACCEPTED_LOGO_MIME_TYPES = ["image/png", "image/jpeg", "image/jpg"];
const ACCEPTED_LOGO_MIME_SET = new Set(ACCEPTED_LOGO_MIME_TYPES);

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
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const [isProcessingLogo, setIsProcessingLogo] = useState(false);
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
    updateClub,
    close,
    courtTypes,
    courtPlacements,
  } = useAddEditClubForm({ editClubId, onOpenChange });

  const handleLogoFileSelection = async (file: File | null) => {
    if (!file || isProcessingLogo || isPending) return;
    if (!ACCEPTED_LOGO_MIME_SET.has(file.type)) {
      toast.error(t("settings.adminClubsLogoInvalidFileType"));
      return;
    }
    if (file.size > MAX_CLUB_LOGO_SIZE_MB * 1024 * 1024) {
      toast.error(t("sponsors.logoUpload.fileTooLarge", { maxMb: MAX_CLUB_LOGO_SIZE_MB }));
      return;
    }
    setIsProcessingLogo(true);
    try {
      const previousLogo = currentForm.logoUrl;
      const uploaded = await uploadImageFile({
        file,
        kind: "club_logo",
        assetId: editClubId ?? undefined,
        replaceUrl: previousLogo.startsWith("http") ? previousLogo : null,
      });
      setField("logoUrl", uploaded.url);
      if (isEdit && editClubId) {
        try {
          await updateClub.mutateAsync({ clubId: editClubId, data: { logoUrl: uploaded.url } });
        } catch (error) {
          setField("logoUrl", previousLogo);
          throw error;
        }
      }
      toast.success(t("settings.adminClubsLogoUploadSuccess"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("settings.adminClubsLogoUploadError"));
    } finally {
      setIsProcessingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const inputClassName =
    "h-9 rounded-[8px] border-[#dfe3e8] bg-[#fafbfc] px-3 text-sm shadow-none placeholder:text-[#010a04]/42 focus-visible:border-[#9fc9ae] focus-visible:ring-2 focus-visible:ring-[#067429]/10";
  const labelClassName =
    "text-[11px] font-semibold uppercase text-[#010a04]/62";
  const fieldClassName = "grid gap-1.5";

  return (
    <Dialog
      open={open}
      onOpenChange={handleDialogOpenChange}
    >
      <DialogContent
        className="flex max-h-[min(88vh,760px)] w-[calc(100vw-2rem)] max-w-[560px] flex-col gap-0 overflow-hidden rounded-[12px] border-[#010a04]/10 bg-white p-0 shadow-[0px_18px_48px_rgba(1,10,4,0.18)] sm:max-w-[560px]"
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0 gap-0 px-5 pb-4 pt-5 sm:px-6">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-[19px] font-semibold leading-tight text-[#010a04] sm:text-[20px]">
              {t("settings.adminClubsModalTitle")}
            </DialogTitle>
            <DialogClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-5 rounded-none p-0 text-[#010a04]/80 hover:bg-transparent hover:text-[#010a04] sm:size-6"
                aria-label={t("common.close")}
              >
                <XIcon className="size-4 sm:size-5" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        {isEdit && loadingClub ? (
          <div className="flex items-center justify-center py-8">
            <InlineLoader />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col border-t border-[#010a04]/8">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4 [scrollbar-color:#cfd6dc_transparent] [scrollbar-width:thin] sm:px-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#cfd6dc] [&::-webkit-scrollbar-track]:bg-transparent">
            <div className={fieldClassName}>
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

            <div className="flex items-center gap-3 rounded-[10px] border border-[#e7eaee] bg-[#fbfcfd] p-3">
              <input
                ref={logoInputRef}
                type="file"
                accept={ACCEPTED_LOGO_MIME_TYPES.join(",")}
                className="hidden"
                onChange={(e) => void handleLogoFileSelection(e.target.files?.[0] ?? null)}
                disabled={isPending || isProcessingLogo}
              />
              {/* Logo preview */}
              <div
                onClick={() => !(isPending || isProcessingLogo) && logoInputRef.current?.click()}
                className="flex size-12 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-[8px] border border-[#dfe3e8] bg-white text-base font-semibold text-[#010a04]/50 transition-colors hover:border-[#067429]/40 hover:bg-[#06742908] sm:size-14"
                title={t("settings.adminClubsLogo")}
              >
                {currentForm.logoUrl ? (
                  <img
                    src={currentForm.logoUrl}
                    alt={t("settings.adminClubsLogo")}
                    className="size-full object-cover"
                  />
                ) : (
                  <span>{currentForm.name.charAt(0).toUpperCase() || "?"}</span>
                )}
              </div>

              {/* Label + action buttons */}
              <div className="flex min-w-0 flex-col gap-1 sm:gap-1.5">
                <p className="text-[11px] font-semibold uppercase text-[#010a04]/62">
                  {t("settings.adminClubsLogo")}
                </p>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isPending || isProcessingLogo}
                    onClick={() => logoInputRef.current?.click()}
                    className="h-7 rounded-[7px] border-[#cfd6dc] bg-white px-2.5 text-[12px] font-medium text-[#010a04] shadow-none hover:bg-[#f4f6f5]"
                  >
                    {isProcessingLogo ? (
                      <InlineLoader size="sm" />
                    ) : (
                      <Upload01Icon size={12} className="text-[#067429] sm:size-[13px]" />
                    )}
                    <span>
                      {currentForm.logoUrl
                        ? t("settings.profilePictureChange")
                        : t("settings.profilePictureUpload")}
                    </span>
                  </Button>

                  {currentForm.logoUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isPending || isProcessingLogo}
                      onClick={async () => {
                        if (isEdit && editClubId) {
                          try {
                            await updateClub.mutateAsync({ clubId: editClubId, data: { logoUrl: null } });
                            setField("logoUrl", "");
                          } catch (error) {
                            toast.error(
                              error instanceof Error ? error.message : t("settings.adminClubsLogoUploadError"),
                            );
                          }
                          return;
                        }
                        setField("logoUrl", "");
                      }}
                      className="h-7 rounded-[7px] border-[#ead1d1] bg-white px-2.5 text-[12px] font-medium text-[#b42318] shadow-none hover:bg-[#fff5f5]"
                    >
                      <Delete01Icon size={12} className="text-[#b42318] sm:size-[13px]" />
                      <span>{t("settings.profilePictureRemove")}</span>
                    </Button>
                  )}
                </div>
                <p className="text-[11px] leading-normal text-[#010a04]/45">
                  PNG, JPEG, JPG · Max {MAX_CLUB_LOGO_SIZE_MB} MB
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className={fieldClassName}>
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

              <div className={fieldClassName}>
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
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className={fieldClassName}>
                <Label htmlFor="club-tennis-lesson-email" className={labelClassName}>
                  {t("settings.adminClubsTennisLessonEmail")}
                </Label>
                <Input
                  id="club-tennis-lesson-email"
                  type="email"
                  placeholder={t("settings.adminClubsTennisLessonEmailPlaceholder")}
                  value={currentForm.tennisLessonRequestEmail}
                  onChange={(event) => setField("tennisLessonRequestEmail", event.target.value)}
                  className={inputClassName}
                />
              </div>

              <div className={fieldClassName}>
                <Label htmlFor="club-membership-email" className={labelClassName}>
                  {t("settings.adminClubsMembershipEmail")}
                </Label>
                <Input
                  id="club-membership-email"
                  type="email"
                  placeholder={t("settings.adminClubsMembershipEmailPlaceholder")}
                  value={currentForm.membershipRequestEmail}
                  onChange={(event) => setField("membershipRequestEmail", event.target.value)}
                  className={inputClassName}
                />
              </div>
            </div>

            <div className={fieldClassName}>
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
            </div>

            <DialogFooter className="grid shrink-0 grid-cols-2 gap-2 border-t border-[#010a04]/8 bg-white px-5 py-4 sm:grid-cols-2 sm:justify-start sm:gap-3 sm:px-6">
              <Button
                type="button"
                variant="outline"
                onClick={close}
                className="h-9 rounded-[8px] border-black/12 bg-white text-sm font-medium text-[#010a04] shadow-none hover:bg-[#f9fafc]"
              >
                {t("settings.adminClubsCancel")}
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="h-9 rounded-[8px] bg-linear-to-r from-[#0a6925] via-[#0c7b2c] to-[#0f8d33] text-sm font-medium text-white hover:opacity-95"
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
