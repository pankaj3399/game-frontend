import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete01Icon, Location01Icon, CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";
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

const emptyCourt = (): CourtInput => ({
  name: "",
  type: "concrete",
  placement: "outdoor",
});

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
  const [longitude, setLongitude] = useState("");
  const [latitude, setLatitude] = useState("");
  const [isLookingUpCoords, setIsLookingUpCoords] = useState(false);
  const [courts, setCourts] = useState<CourtInput[]>([emptyCourt()]);

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
      setLongitude(coords ? String(coords[0]) : "");
      setLatitude(coords ? String(coords[1]) : "");
      setCourts(
        clubData.courts.length > 0
          ? clubData.courts.map((c: { id: string; name: string; type: string; placement: string }) => ({
              id: c.id,
              name: c.name,
              type: c.type as CourtType,
              placement: c.placement as CourtPlacement,
            }))
          : [emptyCourt()]
      );
    } else if (open && !isEdit) {
      setName("");
      setWebsite("");
      setBookingSystemUrl("");
      setAddress("");
      setLongitude("");
      setLatitude("");
      setIsLookingUpCoords(false);
      setCourts([emptyCourt()]);
    }
  }, [open, isEdit, clubData]);

  const handleAddCourt = () => {
    setCourts((prev) => [...prev, emptyCourt()]);
  };

  const handleRemoveCourt = (index: number) => {
    setCourts((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length === 0 ? [emptyCourt()] : next;
    });
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

  const handleLookupFromAddress = async () => {
    const addr = address.trim();
    if (!addr) {
      toast.error(t("settings.adminClubsLookupAddressRequired"));
      return;
    }
    setIsLookingUpCoords(true);
    try {
      const params = new URLSearchParams({
        q: addr,
        format: "json",
        limit: "1",
      });
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`,
        {
          headers: {
            "User-Agent": "TB10-Game-App/1.0 (club-location)",
          },
        }
      );
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        toast.error(t("settings.adminClubsLookupError"));
        return;
      }
      const { lat, lon } = data[0];
      if (lat != null && lon != null) {
        setLatitude(String(lat));
        setLongitude(String(lon));
      } else {
        toast.error(t("settings.adminClubsLookupError"));
      }
    } catch {
      toast.error(t("settings.adminClubsLookupError"));
    } finally {
      setIsLookingUpCoords(false);
    }
  };

  const parseCoordinates = (): [number, number] | null => {
    const lon = parseFloat(longitude);
    const lat = parseFloat(latitude);
    if (
      Number.isNaN(lon) ||
      Number.isNaN(lat) ||
      lon < -180 ||
      lon > 180 ||
      lat < -90 ||
      lat > 90
    ) {
      return null;
    }
    return [lon, lat];
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
    const coords = parseCoordinates();
    if (!coords) {
      toast.error(t("settings.adminClubsCoordinatesRequired"));
      return;
    }

    const courtsPayload = courts
      .filter((c) => c.name.trim())
      .map((c) => ({
        id: c.id,
        name: c.name.trim(),
        type: c.type,
        placement: c.placement,
      }));

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
            <span  className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label className="text-xs font-medium uppercase text-muted-foreground">
                {t("settings.adminClubsClubName")} <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder={t("settings.adminClubsClubNamePlaceholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10"
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-xs font-medium uppercase text-muted-foreground">
                {t("settings.adminClubsWebsite")} <span className="text-muted-foreground/70">(optional)</span>
              </Label>
              <Input
                placeholder={t("settings.adminClubsWebsitePlaceholder")}
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="h-10"
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-xs font-medium uppercase text-muted-foreground">
                {t("settings.adminClubsBookingUrl")} <span className="text-muted-foreground/70">(optional)</span>
              </Label>
              <Input
                placeholder={t("settings.adminClubsBookingUrlPlaceholder")}
                value={bookingSystemUrl}
                onChange={(e) => setBookingSystemUrl(e.target.value)}
                className="h-10"
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-xs font-medium uppercase text-muted-foreground">
                {t("settings.adminClubsAddress")} <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder={t("settings.adminClubsAddressPlaceholder")}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="h-10"
              />
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium uppercase text-muted-foreground">
                      {t("settings.adminClubsCoordinates")} <span className="text-destructive">*</span>
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {t("settings.adminClubsCoordinatesHint")}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant={longitude && latitude ? "outline" : "secondary"}
                    size="sm"
                    onClick={handleLookupFromAddress}
                    disabled={!address.trim() || isLookingUpCoords}
                    className="shrink-0 gap-2 font-medium"
                  >
                    {isLookingUpCoords ? (
                      <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <HugeiconsIcon
                        icon={longitude && latitude ? CheckmarkCircle01Icon : Location01Icon}
                        size={18}
                        className={longitude && latitude ? "text-emerald-600" : undefined}
                      />
                    )}
                    {isLookingUpCoords
                      ? t("settings.adminClubsLookupFromAddressLoading")
                      : longitude && latitude
                        ? t("settings.adminClubsLookupAgain")
                        : t("settings.adminClubsLookupFromAddress")}
                  </Button>
                </div>
       
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label
                      htmlFor="club-longitude"
                      className="text-xs text-muted-foreground"
                    >
                      {t("settings.adminClubsLongitude")}
                    </Label>
                    <Input
                      id="club-longitude"
                      type="number"
                      step="any"
                      min={-180}
                      max={180}
                      placeholder={t("settings.adminClubsLongitudePlaceholder")}
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label
                      htmlFor="club-latitude"
                      className="text-xs text-muted-foreground"
                    >
                      {t("settings.adminClubsLatitude")}
                    </Label>
                    <Input
                      id="club-latitude"
                      type="number"
                      step="any"
                      min={-90}
                      max={90}
                      placeholder={t("settings.adminClubsLatitudePlaceholder")}
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      className="h-10"
                    />
                  </div>
                </div>
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
                className="bg-[#22c55e] text-white hover:bg-[#16a34a]"
              >
                {isPending ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
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
