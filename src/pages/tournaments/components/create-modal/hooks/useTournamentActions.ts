import { useCallback, useState } from "react";
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

  const [creationAction, setCreationAction] = useState<
    "draft" | "publish" | null
  >(null);

  const isPublishing =
    (creationAction === "publish" && createTournament.isPending) ||
    publishTournament.isPending;

  const isSavingDraft =
    (creationAction === "draft" && createTournament.isPending) ||
    updateTournament.isPending;

  const isMutating = isSavingDraft || isPublishing;

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
      if (validTournamentId) {
        const updatePayload = buildDraftUpdatePayload(form);
        await updateTournament.mutateAsync({
          id: validTournamentId,
          data: updatePayload,
        });
      } else {
        setCreationAction("draft");
        try {
          const createPayload = buildTournamentPayload(form, "draft");
          await createTournament.mutateAsync(createPayload);
        } finally {
          setCreationAction(null);
        }
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
        setCreationAction("publish");
        try {
          await createTournament.mutateAsync(
            buildTournamentPayload(form, "active")
          );
        } finally {
          setCreationAction(null);
        }
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
    isPublishing,
    isSavingDraft,
    handleClose,
    handleSaveDraft,
    handlePublish,
  };
}
