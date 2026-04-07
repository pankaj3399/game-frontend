import { useCallback, useMemo } from "react";
import type { TFunction } from "i18next";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";
import { buildDraftUpdatePayload, buildTournamentPayload } from "@/lib/tournament/form";
import type { CreateTournamentInput } from "@/models/tournament/types";
import {
  useCreateTournament,
  usePublishTournament,
  useUpdateTournament,
} from "@/pages/tournaments/hooks";

interface UseTournamentActionsArgs {
  form: CreateTournamentInput;
  validTournamentId: string | null;
  onOpenChange: (open: boolean) => void;
  t: TFunction;
  draftValidationError: string | null;
  publishValidationError: string | null;
}

export function useTournamentActions({
  form,
  validTournamentId,
  onOpenChange,
  t,
  draftValidationError,
  publishValidationError,
}: UseTournamentActionsArgs) {
  const createTournament = useCreateTournament();
  const updateTournament = useUpdateTournament();
  const publishTournament = usePublishTournament();

  const isMutating = useMemo(
    () => createTournament.isPending || updateTournament.isPending || publishTournament.isPending,
    [createTournament.isPending, publishTournament.isPending, updateTournament.isPending]
  );

  const handleClose = useCallback(
    (nextOpen: boolean) => {
      onOpenChange(nextOpen);
    },
    [onOpenChange]
  );

  const handleSaveDraft = useCallback(async () => {
    if (draftValidationError) {
      toast.error(t(draftValidationError));
      return;
    }

    try {
      const payload = buildTournamentPayload(form, "draft");

      if (validTournamentId) {
        await updateTournament.mutateAsync({
          id: validTournamentId,
          data: payload,
        });
      } else {
        await createTournament.mutateAsync(payload);
      }

      toast.success(t("tournaments.draftSaved"));
      handleClose(false);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) ?? t("tournaments.saveError"));
    }
  }, [
    createTournament,
    draftValidationError,
    form,
    handleClose,
    t,
    updateTournament,
    validTournamentId,
  ]);

  const handlePublish = useCallback(async () => {
    if (publishValidationError) {
      toast.error(t(publishValidationError));
      return;
    }

    try {
      if (validTournamentId) {
        await publishTournament.mutateAsync({
          id: validTournamentId,
          data: buildDraftUpdatePayload(form),
        });
      } else {
        await createTournament.mutateAsync(buildTournamentPayload(form, "active"));
      }

      toast.success(t("tournaments.published"));
      handleClose(false);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) ?? t("tournaments.publishError"));
    }
  }, [
    createTournament,
    form,
    handleClose,
    publishTournament,
    publishValidationError,
    t,
    validTournamentId,
  ]);

  return {
    isMutating,
    handleClose,
    handleSaveDraft,
    handlePublish,
  };
}
