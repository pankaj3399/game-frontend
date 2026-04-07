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

  const initialForm = useMemo<CreateTournamentInput>(() => {
    if (isEditMode && tournamentData?.tournament) {
      return mapTournamentDetailToForm(tournamentData.tournament);
    }

    return DEFAULT_CREATE_TOURNAMENT_FORM;
  }, [isEditMode, tournamentData]);

  const [form, setForm] = useState<CreateTournamentInput>(initialForm);

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(initialForm);
  }, [initialForm, open]);

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
