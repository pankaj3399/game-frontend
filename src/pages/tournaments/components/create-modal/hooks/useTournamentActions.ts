import { useCallback, useState } from "react";
import type { TFunction } from "i18next";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";
import { buildTournamentPayload, buildUpdatePayload } from "@/lib/tournament/form";
import type {
  CreateTournamentInput,
  UpdateTournamentInput,
} from "@/models/tournament/types";
import {
  useCreateTournament,
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

  const [creationAction, setCreationAction] = useState<
    "draft" | "publish" | null
  >(null);
  const [updateAction, setUpdateAction] = useState<
    "draft" | "publish" | null
  >(null);

  const isPublishing =
    (creationAction === "publish" && createTournament.isPending) ||
    (updateAction === "publish" && updateTournament.isPending);

  const isSavingDraft =
    (creationAction === "draft" && createTournament.isPending) ||
    (updateAction === "draft" && updateTournament.isPending);

  const isMutating = isSavingDraft || isPublishing;

  const performUpdate = useCallback(
    async (
      id: string,
      action: "draft" | "publish",
      data: UpdateTournamentInput
    ) => {
      setUpdateAction(action);
      try {
        await updateTournament.mutateAsync({ id, data });
      } finally {
        setUpdateAction(null);
      }
    },
    [updateTournament]
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
      if (validTournamentId) {
        await performUpdate(validTournamentId, "draft", {
          ...buildUpdatePayload(form),
          status: "draft",
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
    performUpdate,
    t,
    validTournamentId,
  ]);

  const handlePublish = useCallback(async () => {
    if (publishValidationError) {
      toast.error(t(publishValidationError));
      return;
    }

    try {
      if (validTournamentId) {
        await performUpdate(validTournamentId, "publish", {
          ...buildUpdatePayload(form),
          status: "active",
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
    performUpdate,
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
