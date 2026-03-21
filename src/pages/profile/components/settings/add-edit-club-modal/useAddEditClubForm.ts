import { useMemo, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import {
  useCreateClub,
  useUpdateClub,
  useClubById,
  type CourtInput,
  type CourtType,
  type CourtPlacement,
} from "@/pages/clubs/hooks";
import type { MapboxFeature } from "@/pages/profile/hooks";

const COURT_TYPES: CourtType[] = ["concrete", "clay", "hard", "grass", "carpet", "other"];
const COURT_PLACEMENTS: CourtPlacement[] = ["indoor", "outdoor"];

interface ClubFormState {
  name: string;
  website: string;
  bookingSystemUrl: string;
  address: string;
  coordinates: [number, number] | null;
  courts: CourtInput[];
}

interface UseAddEditClubFormOptions {
  editClubId: string | null;
  onOpenChange: (open: boolean) => void;
}

function toCourtType(value: string): CourtType {
  return COURT_TYPES.includes(value as CourtType) ? (value as CourtType) : "concrete";
}

function toCourtPlacement(value: string): CourtPlacement {
  return COURT_PLACEMENTS.includes(value as CourtPlacement) ? (value as CourtPlacement) : "outdoor";
}

function firstCourt(): CourtInput {
  return { name: "1", type: "concrete", placement: "outdoor" };
}

function courtWithDefaultsFrom(existingCourts: CourtInput[]): CourtInput {
  if (existingCourts.length === 0) return firstCourt();

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
}

export function useAddEditClubForm({ editClubId, onOpenChange }: UseAddEditClubFormOptions) {
  const { t } = useTranslation();
  const isEdit = !!editClubId;
  const [form, setForm] = useState<ClubFormState | null>(null);

  const { data: clubData, isLoading: loadingClub } = useClubById(editClubId);
  const createClub = useCreateClub();
  const updateClub = useUpdateClub();

  const isPending = createClub.isPending || updateClub.isPending;

  const initialForm = useMemo<ClubFormState>(() => {
    if (isEdit && clubData) {
      return {
        name: clubData.club.name,
        website: clubData.club.website ?? "",
        bookingSystemUrl: clubData.club.bookingSystemUrl ?? "",
        address: clubData.club.address,
        coordinates: clubData.club.coordinates
          ? [clubData.club.coordinates[0], clubData.club.coordinates[1]]
          : null,
        courts:
          clubData.courts.length > 0
            ? clubData.courts.map((court) => ({
                id: court.id,
                name: court.name,
                type: toCourtType(court.type),
                placement: toCourtPlacement(court.placement),
              }))
            : [],
      };
    }

    return {
      name: "",
      website: "",
      bookingSystemUrl: "",
      address: "",
      coordinates: null,
      courts: [firstCourt()],
    };
  }, [clubData, isEdit]);

  const currentForm = form ?? initialForm;

  function updateForm(updater: (base: ClubFormState) => ClubFormState) {
    setForm((previous) => updater(previous ?? initialForm));
  }

  const setField = <K extends keyof ClubFormState>(field: K, value: ClubFormState[K]) => {
    updateForm((base) => ({ ...base, [field]: value }));
  };

  const handleAddCourt = () => {
    updateForm((base) => ({ ...base, courts: [...base.courts, courtWithDefaultsFrom(base.courts)] }));
  };

  const handleRemoveCourt = (index: number) => {
    updateForm((base) => ({ ...base, courts: base.courts.filter((_, i) => i !== index) }));
  };

  const handleCourtChange = (index: number, field: keyof CourtInput, value: string) => {
    updateForm((base) => ({
      ...base,
      courts: base.courts.map((court, i) => (i === index ? { ...court, [field]: value } : court)),
    }));
  };

  const handleLocationSelect = (feature: MapboxFeature) => {
    updateForm((base) => ({
      ...base,
      address: feature.fullAddress || feature.placeName,
      coordinates: feature.coordinates,
    }));
  };

  const handleAddressChange = (value: string) => {
    updateForm((base) => ({
      ...base,
      address: value,
      coordinates: null,
    }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!currentForm.name.trim()) {
      toast.error(t("settings.adminClubsClubNamePlaceholder"));
      return;
    }
    if (!currentForm.address.trim()) {
      toast.error(t("settings.adminClubsAddressPlaceholder"));
      return;
    }
    if (!currentForm.coordinates) {
      toast.error(t("settings.adminClubsLookupError"));
      return;
    }

    const courtsPayload = currentForm.courts
      .filter((court) => court.name.trim())
      .map((court) => ({
        id: court.id,
        name: court.name.trim(),
        type: court.type,
        placement: court.placement,
      }));

    const seen = new Set<string>();
    const hasDuplicate = courtsPayload.some((court) => {
      const key = court.name;
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
            name: currentForm.name.trim(),
            website: currentForm.website.trim() || null,
            bookingSystemUrl: currentForm.bookingSystemUrl.trim() || null,
            address: currentForm.address.trim(),
            coordinates: currentForm.coordinates,
            courts: courtsPayload.length > 0 ? courtsPayload : [],
          },
        });
        toast.success(t("settings.adminClubsUpdateSuccess"));
      } else {
        await createClub.mutateAsync({
          name: currentForm.name.trim(),
          website: currentForm.website.trim() || null,
          bookingSystemUrl: currentForm.bookingSystemUrl.trim() || null,
          address: currentForm.address.trim(),
          coordinates: currentForm.coordinates,
          courts: courtsPayload,
        });
        toast.success(t("settings.adminClubsCreateSuccess"));
      }
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error(
        (isAxiosError(error) ? error.response?.data?.message : undefined) ??
          (isEdit ? t("settings.adminClubsUpdateError") : t("settings.adminClubsCreateError"))
      );
    }
  };

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setForm(null);
    onOpenChange(nextOpen);
  };

  return {
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
    close: () => onOpenChange(false),
    courtTypes: COURT_TYPES,
    courtPlacements: COURT_PLACEMENTS,
  };
}
