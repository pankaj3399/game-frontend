import { useState } from "react";

type TournamentModalState =
  | { type: "create" }
  | null;

export function useTournamentActions() {
  const [modal, setModal] = useState<TournamentModalState>(null);

  const openCreateModal = () => setModal({ type: "create" });
  const closeModal = () => setModal(null);

  return {
    modal,
    openCreateModal,
    closeModal,
  };
}
