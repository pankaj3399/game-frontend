import { useCallback, useState } from "react";
import type { TournamentScheduleMatch } from "@/models/tournament/types";
import {
  applyScoreInputChange,
  createScoreEditorRows,
  type ScoreEditorRow,
} from "@/pages/tournaments/schedule/utils/matchScheduleScore";

type UseMatchEditorOptions = {
  onSave?: (match: TournamentScheduleMatch, rows: ScoreEditorRow[]) => Promise<boolean> | boolean;
};

export function useMatchEditor(options?: UseMatchEditorOptions) {
  const [editingMatch, setEditingMatch] = useState<TournamentScheduleMatch | null>(null);
  const [editableRows, setEditableRows] = useState<ScoreEditorRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const openEditor = useCallback((match: TournamentScheduleMatch) => {
    setEditingMatch(match);
    setEditableRows(createScoreEditorRows(match));
    setSaveError((prev) => {
      if (!prev) return prev;
      return null;
    });
  }, []);

  const closeEditor = useCallback(() => {
    setEditingMatch(null);
    setEditableRows([]);
    setSaveError(null);
  }, []);

  const updateRow = useCallback(
    (rowId: string, side: "playerOne" | "playerTwo", value: string, setIndex: number) => {
      if (!editingMatch) return;
      setEditableRows((prev) =>
        applyScoreInputChange(prev, rowId, side, value, editingMatch.playMode, setIndex)
      );
    },
    [editingMatch]
  );

  const save = useCallback(async (): Promise<boolean> => {
    if (!editingMatch) return true;
    if (!options?.onSave) {
      setSaveError("No save handler configured");
      setIsSaving(false);
      return false;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      const result = await Promise.resolve(options.onSave(editingMatch, editableRows));
      return Boolean(result);
    } catch (err: unknown) {
      setSaveError((err as Error)?.message ?? String(err));
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [editingMatch, editableRows, options]);

  return {
    editingMatch,
    editableRows,
    isSaving,
    saveError,
    openEditor,
    closeEditor,
    save,
    updateRow,
  };
}

export default useMatchEditor;
