import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
      if (!tournamentData?.tournament) {
        return null;
      }
      const mapped = mapTournamentDetailToForm(tournamentData.tournament);
      const mappedDefined = Object.fromEntries(
        Object.entries(mapped).filter(([, value]) => value !== undefined)
      ) as Partial<CreateTournamentInput>;
      return {
        ...DEFAULT_CREATE_TOURNAMENT_FORM,
        ...mappedDefined,
      };
    }
    return DEFAULT_CREATE_TOURNAMENT_FORM;
  }, [isEditMode, tournamentData]);

  const [form, setForm] = useState<CreateTournamentInput>(DEFAULT_CREATE_TOURNAMENT_FORM);
  const hasUserEditedRef = useRef(false);
  const previousOpenRef = useRef(open);
  const previousInitialFormRef = useRef<CreateTournamentInput | null>(null);
  const previousValidTournamentIdRef = useRef<string | null>(validTournamentId);

  useEffect(() => {
    const justOpened = open && !previousOpenRef.current;
    previousOpenRef.current = open;

    if (!open) {
      hasUserEditedRef.current = false;
      previousValidTournamentIdRef.current = validTournamentId;
      return;
    }
    if (validTournamentId !== previousValidTournamentIdRef.current) {
      hasUserEditedRef.current = false;
      previousValidTournamentIdRef.current = validTournamentId;
    }
    if (isEditMode && (isTournamentLoading || initialForm === null)) {
      return;
    }
    const initialChanged = previousInitialFormRef.current !== initialForm;
    if (initialForm !== null && (justOpened || (!hasUserEditedRef.current && initialChanged))) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm(initialForm);
    }
    previousInitialFormRef.current = initialForm;
  }, [open, isEditMode, isTournamentLoading, initialForm, validTournamentId]);

  const { data: sponsorsData, isLoading: isSponsorsLoading } = useClubSponsors(
    open ? form.club || null : null
  );
  const sponsors = sponsorsData?.sponsors ?? [];

  const update = useCallback((updates: Partial<CreateTournamentInput>) => {
    hasUserEditedRef.current = true;
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
