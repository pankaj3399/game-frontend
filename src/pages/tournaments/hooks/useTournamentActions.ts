import { useState } from "react";
import { useTranslation } from "react-i18next";
import { usePublishTournament } from "@/pages/tournaments/hooks/tournament";
import { getErrorMessage } from "@/lib/errors";
import { toast } from "sonner";

type TournamentModalState =
  | { type: "create" }
  | { type: "edit"; id: string }
  | null;

interface UseTournamentActionsOptions {
  onPublished?: () => void;
}

export function useTournamentActions({ onPublished }: UseTournamentActionsOptions = {}) {
  const { t } = useTranslation();
  const publishTournament = usePublishTournament();
  const [modal, setModal] = useState<TournamentModalState>(null);

  const openCreateModal = () => setModal({ type: "create" });
  const openEditModal = (id: string) => setModal({ type: "edit", id });
  const closeModal = () => setModal(null);

  const publishDraft = async (id: string) => {
    try {
      await publishTournament.mutateAsync({ id, data: {} });
      toast.success(t("tournaments.published"));
      onPublished?.();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) ?? t("tournaments.publishError"));
    }
  };

  return {
    modal,
    openCreateModal,
    openEditModal,
    closeModal,
    publishDraft,
    isPublishing: publishTournament.isPending,
  };
}
