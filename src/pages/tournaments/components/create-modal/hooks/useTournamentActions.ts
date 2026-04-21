import { useCallback, useState } from "react";
import type { TFunction } from "i18next";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";
import {
  buildTournamentPayload,
  buildUpdatePayload,
  getDraftValidationError,
  getPublishValidationError,
} from "@/lib/tournament/form";
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
  /** Commits Details tab draft inputs; merged into form for this submit tick. */
  commitDetailsDrafts?: () => Partial<CreateTournamentInput>;
}

export function useTournamentActions({
  form,
  validTournamentId,
  onOpenChange,
  t,
  commitDetailsDrafts,
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
    const detailsPatch = commitDetailsDrafts?.() ?? {};
    const mergedForm = { ...form, ...detailsPatch };
    const mergedDraftError = getDraftValidationError(mergedForm);
    if (mergedDraftError) {
      toast.error(t(mergedDraftError));
      return;
    }

    try {
      if (validTournamentId) {
        await performUpdate(validTournamentId, "draft", {
          ...buildUpdatePayload(mergedForm),
          status: "draft",
        });
      } else {
        setCreationAction("draft");
        try {
          const createPayload = buildTournamentPayload(mergedForm, "draft");
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
    commitDetailsDrafts,
    createTournament,
    form,
    handleClose,
    performUpdate,
    t,
    validTournamentId,
  ]);

  const handlePublish = useCallback(async () => {
    const detailsPatch = commitDetailsDrafts?.() ?? {};
    const mergedForm = { ...form, ...detailsPatch };
    const mergedPublishError = getPublishValidationError(mergedForm);
    if (mergedPublishError) {
      toast.error(t(mergedPublishError));
      return;
    }

    try {
      if (validTournamentId) {
        await performUpdate(validTournamentId, "publish", {
          ...buildUpdatePayload(mergedForm),
          status: "active",
        });
      } else {
        setCreationAction("publish");
        try {
          await createTournament.mutateAsync(
            buildTournamentPayload(mergedForm, "active")
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
    commitDetailsDrafts,
    createTournament,
    form,
    handleClose,
    performUpdate,
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
