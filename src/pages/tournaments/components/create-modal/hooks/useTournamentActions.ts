import { useCallback, useState } from "react";
import type { TFunction } from "i18next";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";
import {
  buildChangedUpdatePayload,
  buildTournamentPayload,
  getDraftValidationError,
  getPublishValidationError,
} from "@/lib/tournament/form";
import type {
  CreateTournamentInput,
  TournamentStatus,
  UpdateTournamentInput,
} from "@/models/tournament/types";
import {
  useCreateTournament,
  useUpdateTournament,
} from "@/pages/tournaments/hooks";

interface UseTournamentActionsArgs {
  form: CreateTournamentInput;
  initialForm: CreateTournamentInput | null;
  validTournamentId: string | null;
  originalTournamentStatus: TournamentStatus | null;
  onOpenChange: (open: boolean) => void;
  t: TFunction;
  /** Commits Details tab draft inputs; merged into form for this submit tick. */
  commitDetailsDrafts?: () => Partial<CreateTournamentInput>;
}

export function useTournamentActions({
  form,
  initialForm,
  validTournamentId,
  originalTournamentStatus,
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

  const getUpdatePayloadForAction = useCallback(
    (
      mergedForm: CreateTournamentInput,
      nextStatus: TournamentStatus
    ): UpdateTournamentInput => {
      const changedFields = buildChangedUpdatePayload(mergedForm, initialForm);
      if (originalTournamentStatus !== nextStatus) {
        return {
          ...changedFields,
          status: nextStatus,
        };
      }
      return changedFields;
    },
    [initialForm, originalTournamentStatus]
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
      let didPersistDraft = false;
      if (validTournamentId) {
        const payload = getUpdatePayloadForAction(mergedForm, "draft");
        if (Object.keys(payload).length > 0) {
          await performUpdate(validTournamentId, "draft", payload);
          didPersistDraft = true;
        }
      } else {
        setCreationAction("draft");
        try {
          const createPayload = buildTournamentPayload(mergedForm, "draft");
          await createTournament.mutateAsync(createPayload);
          didPersistDraft = true;
        } finally {
          setCreationAction(null);
        }
      }

      if (didPersistDraft) {
        toast.success(t("tournaments.draftSaved"));
      }
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
    getUpdatePayloadForAction,
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
      let didPersistPublish = false;
      if (validTournamentId) {
        const payload = getUpdatePayloadForAction(mergedForm, "active");
        if (Object.keys(payload).length > 0) {
          await performUpdate(validTournamentId, "publish", payload);
          didPersistPublish = true;
        }
      } else {
        setCreationAction("publish");
        try {
          await createTournament.mutateAsync(
            buildTournamentPayload(mergedForm, "active")
          );
          didPersistPublish = true;
        } finally {
          setCreationAction(null);
        }
      }

      if (didPersistPublish) {
        toast.success(t("tournaments.published"));
      }
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
    getUpdatePayloadForAction,
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
