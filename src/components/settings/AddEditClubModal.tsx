import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete01Icon } from "@hugeicons/core-free-icons";
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
import { LocationSearchInput } from "@/components/settings/LocationSearchInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateClub,
  useUpdateClub,
  useClubById,
  type CourtInput,
  type CourtType,
  type CourtPlacement,
} from "@/hooks/club";
import { toast } from "sonner";
import {type  MapboxFeature } from "@/hooks/useMapboxSearch";
import InlineLoader from "@/components/shared/InlineLoader";

const COURT_TYPES: CourtType[] = [
  "concrete",
  "clay",
  "hard",
  "grass",
  "carpet",
  "other",
];
const COURT_PLACEMENTS: CourtPlacement[] = ["indoor", "outdoor"];

interface AddEditClubModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editClubId: string | null;
}

/** First court defaults: name "1", concrete, outdoor */
const firstCourt = (): CourtInput => ({
  name: "1",
  type: "concrete",
  placement: "outdoor",
});

/** New court with last court's type/placement, name = next unused numeric index (1, 2, 3, ...) */
const courtWithDefaultsFrom = (existingCourts: CourtInput[]): CourtInput => {
  if (existingCourts.length === 0) {
    return firstCourt();
  }

  const usedNumericNames = new Set(
    existingCourts
      .map((court) => court.name.trim())
      .filter((name) => /^\d+$/.test(name))
      .map((name) => Number(name))
      .filter((value) => Number.isInteger(value) && value > 0)
  );

  let nextName = 1;
  while (usedNumericNames.has(nextName)) {
    nextName += 1;
  }

  const last = existingCourts[existingCourts.length - 1];
  return {
    name: String(nextName),
    type: last?.type ?? "concrete",
    placement: last?.placement ?? "outdoor",
  };
};

export function AddEditClubModal({
  open,
  onOpenChange,
  editClubId,
}: AddEditClubModalProps) {
  const { t } = useTranslation();
  const isEdit = !!editClubId;

  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [bookingSystemUrl, setBookingSystemUrl] = useState("");
  const [address, setAddress] = useState("");
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  const [courts, setCourts] = useState<CourtInput[]>([firstCourt()]);

  const { data: clubData, isLoading: loadingClub } = useClubById(editClubId);
  const createClub = useCreateClub();
  const updateClub = useUpdateClub();

  const isPending = createClub.isPending || updateClub.isPending;

  useEffect(() => {
    if (open && isEdit && clubData) {
      setName(clubData.club.name);
      setWebsite(clubData.club.website ?? "");
      setBookingSystemUrl(clubData.club.bookingSystemUrl ?? "");
      setAddress(clubData.club.address);
      const coords = clubData.club.coordinates;
      setCoordinates(coords ? [coords[0], coords[1]] : null);
      setCourts(
        clubData.courts.length > 0
          ? clubData.courts.map((c: { id: string; name: string; type: string; placement: string }) => ({
              id: c.id,
              name: c.name,
              type: c.type as CourtType,
              placement: c.placement as CourtPlacement,
            }))
          : []
      );
    } else if (open && !isEdit) {
      setName("");
      setWebsite("");
      setBookingSystemUrl("");
      setAddress("");
      setCoordinates(null);
      setCourts([firstCourt()]);
    }
  }, [open, isEdit, clubData]);

  const handleAddCourt = () => {
    setCourts((prev) => [...prev, courtWithDefaultsFrom(prev)]);
  };

  const handleRemoveCourt = (index: number) => {
    setCourts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCourtChange = (
    index: number,
    field: keyof CourtInput,
    value: string
  ) => {
    setCourts((prev) =>
      prev.map((c, i) =>
        i === index ? { ...c, [field]: value } : c
      )
    );
  };

  const handleLocationSelect = (feature: MapboxFeature) => {
    setAddress(feature.fullAddress || feature.placeName);
    setCoordinates(feature.coordinates);
  };

  const handleAddressChange = (value: string) => {
    setAddress(value);
    // Clear coordinates when the user manually edits the address;
    // they must select a Mapbox suggestion again to set valid coordinates.
    setCoordinates(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(t("settings.adminClubsClubNamePlaceholder"));
      return;
    }
    if (!address.trim()) {
      toast.error(t("settings.adminClubsAddressPlaceholder"));
      return;
    }
    if (!coordinates) {
      // Require that the user selects an address from the Mapbox suggestions
      // so we always have valid coordinates from Mapbox.
      toast.error(t("settings.adminClubsLookupError"));
      return;
    }
    const coords = coordinates;

    const courtsPayload = courts
      .filter((c) => c.name.trim())
      .map((c) => ({
        id: c.id,
        name: c.name.trim(),
        type: c.type,
        placement: c.placement,
      }));

    const courtKey = (c: { name: string; type: string; placement: string }) =>
      `${c.name}|${c.type}|${c.placement}`;
    const seen = new Set<string>();
    const hasDuplicate = courtsPayload.some((c) => {
      const key = courtKey(c);
      if (seen.has(key)) return true;
      seen.add(key);
      return false;
    });
    if (hasDuplicate) {
      toast.error(t("settings.adminClubsDuplicateCourtError"));
      return;
    }

    try {
      if (isEdit && editClubId) {
        await updateClub.mutateAsync({
          clubId: editClubId,
          data: {
            name: name.trim(),
            website: website.trim() || null,
            bookingSystemUrl: bookingSystemUrl.trim() || null,
            address: address.trim(),
            coordinates: coords,
            courts: courtsPayload.length > 0 ? courtsPayload : [],
          },
        });
        toast.success(t("settings.adminClubsUpdateSuccess"));
      } else {
        await createClub.mutateAsync({
          name: name.trim(),
          website: website.trim() || null,
          bookingSystemUrl: bookingSystemUrl.trim() || null,
          address: address.trim(),
          coordinates: coords!,
          courts: courtsPayload,
        });
        toast.success(t("settings.adminClubsCreateSuccess"));
      }
      onOpenChange(false);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(
        axiosErr?.response?.data?.message ??
          (isEdit
            ? t("settings.adminClubsUpdateError")
            : t("settings.adminClubsCreateError"))
      );
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
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
                value={bookingSystemUrl}
                onChange={(e) => setBookingSystemUrl(e.target.value)}
                className="h-10"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="club-address" className="text-xs font-medium uppercase text-muted-foreground">
                {t("settings.adminClubsAddress")} <span className="text-destructive">*</span>
              </Label>
              <LocationSearchInput
                id="club-address"
                value={address}
                onChange={handleAddressChange}
                onSelect={handleLocationSelect}
                placeholder={t("settings.adminClubsLocationSearchPlaceholder")}
                searchingLabel={t("settings.adminClubsLocationSearching")}
              />
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-medium uppercase text-muted-foreground">
                {t("settings.adminClubsAllCourts")} <span className="text-muted-foreground/70">(optional)</span>
              </Label>
              <div className="rounded-lg border border-[#e5e7eb] overflow-hidden">
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 p-2 bg-[#f9fafb] text-xs font-medium uppercase text-muted-foreground">
                  <span>{t("settings.adminClubsCourtName")}</span>
                  <span className="w-24">{t("settings.adminClubsCourtType")}</span>
                  <span className="w-24">
                    {t("settings.adminClubsCourtPlacement")}
                  </span>
                  <span className="w-8" />
                </div>
                {courts.map((court, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-[1fr_auto_auto_auto] gap-2 p-2 items-center border-t border-[#e5e7eb]"
                  >
                    <Input
                      placeholder={t("settings.adminClubsCourtName")}
                      value={court.name}
                      onChange={(e) =>
                        handleCourtChange(index, "name", e.target.value)
                      }
                      className="h-9 text-sm"
                    />
                    <Select
                      value={court.type}
                      onValueChange={(v) =>
                        handleCourtChange(index, "type", v)
                      }
                    >
                      <SelectTrigger className="h-9 w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COURT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {t(
                              `settings.adminClubsCourtType${type.charAt(0).toUpperCase()}${type.slice(1)}`
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={court.placement}
                      onValueChange={(v) =>
                        handleCourtChange(index, "placement", v)
                      }
                    >
                      <SelectTrigger className="h-9 w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COURT_PLACEMENTS.map((p) => (
                          <SelectItem key={p} value={p}>
                            {t(
                              `settings.adminClubsCourtPlacement${p.charAt(0).toUpperCase()}${p.slice(1)}`
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveCourt(index)}
                      aria-label={t("settings.adminClubsDeleteCourtAria")}
                    >
                      <HugeiconsIcon icon={Delete01Icon} size={16} />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddCourt}
                className="w-full"
              >
                {t("settings.adminClubsAddCourt")}
              </Button>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
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
