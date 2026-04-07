import { useCallback, useEffect, useMemo, useState } from "react";
import { useClubSponsors } from "@/pages/sponsors/hooks";
import { useTournamentById } from "@/pages/tournaments/hooks";
import type { CreateTournamentInput } from "@/models/tournament/types";
import {
  DEFAULT_CREATE_TOURNAMENT_FORM,
  getDraftValidationError,
  getPublishValidationError,
  mapTournamentDetailToForm,
} from "@/lib/tournament/form";

interface UseTournamentFormArgs {
  mode: "create" | "edit";
  tournamentId?: string | null;
  open: boolean;
}

export function useTournamentForm({ mode, tournamentId = null, open }: UseTournamentFormArgs) {
  const isEditMode = mode === "edit";
  const validTournamentId = isEditMode && tournamentId ? tournamentId : null;

  const { data: tournamentData, isLoading: isTournamentLoading } = useTournamentById(
    validTournamentId,
    Boolean(validTournamentId && open)
  );

  const initialForm = useMemo((): CreateTournamentInput | null => {
    if (isEditMode) {
      return tournamentData?.tournament
        ? mapTournamentDetailToForm(tournamentData.tournament)
        : null;
    }
    return DEFAULT_CREATE_TOURNAMENT_FORM;
  }, [isEditMode, tournamentData]);

  const [form, setForm] = useState<CreateTournamentInput>(DEFAULT_CREATE_TOURNAMENT_FORM);

  useEffect(() => {
    if (!open) {
      return;
    }
    if (isEditMode && (isTournamentLoading || initialForm === null)) {
      return;
    }
    if (initialForm !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm(initialForm);
    }
  }, [open, isEditMode, isTournamentLoading, initialForm]);

  const { data: sponsorsData, isLoading: isSponsorsLoading } = useClubSponsors(form.club || null);
  const sponsors = sponsorsData?.sponsors ?? [];

  const update = useCallback((updates: Partial<CreateTournamentInput>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  }, []);

  const draftValidationError = useMemo(() => getDraftValidationError(form), [form]);
  const publishValidationError = useMemo(() => getPublishValidationError(form), [form]);

  return {
    form,
    sponsors,
    isSponsorsLoading,
    isEditMode,
    validTournamentId,
    isTournamentLoading,
    draftValidationError,
    publishValidationError,
    update,
  };
}
