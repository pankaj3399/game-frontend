import { useCallback, useEffect, useRef, useState } from "react";
import type { RecordTournamentMatchScoreInput } from "@/models/tournament/types";
import { useUpdateScoreQrScores } from "@/pages/tournaments/hooks/useTournamentScoreQr";

const DEBOUNCE_MS = 400;

type UseQrScoreDraftSyncArgs = {
  enabled: boolean;
  requestId: string | null | undefined;
  /** Serialized score payload key — changes when rows/scores change. */
  draftKey: string;
  buildInput: (showErrorToast: boolean) => RecordTournamentMatchScoreInput | null;
  onSyncError?: (message: string) => void;
};

/**
 * Debounced, serial PATCH sync for an active score-QR session.
 * Never blocks local edits; always flushes the latest draft after the in-flight request finishes.
 */
export function useQrScoreDraftSync({
  enabled,
  requestId,
  draftKey,
  buildInput,
  onSyncError,
}: UseQrScoreDraftSyncArgs) {
  const updateMutation = useUpdateScoreQrScores();
  const [lastSyncedDraftKey, setLastSyncedDraftKey] = useState<string | null>(null);
  const [isFlushing, setIsFlushing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const latestDraftKeyRef = useRef(draftKey);
  const lastSyncedDraftKeyRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flushInFlightRef = useRef(false);

  latestDraftKeyRef.current = draftKey;
  lastSyncedDraftKeyRef.current = lastSyncedDraftKey;

  const normalizedRequestId = requestId ?? null;

  const isDirty =
    enabled &&
    Boolean(normalizedRequestId) &&
    draftKey.length > 0 &&
    lastSyncedDraftKey !== draftKey;

  const clearDebounce = useCallback(() => {
    if (debounceTimerRef.current != null) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  const runFlush = useCallback(async () => {
    if (!enabled || !normalizedRequestId || flushInFlightRef.current) return;

    const keyToSend = latestDraftKeyRef.current;
    if (!keyToSend || keyToSend === lastSyncedDraftKeyRef.current) {
      return;
    }

    const input = buildInput(false);
    if (!input) {
      return;
    }

    flushInFlightRef.current = true;
    setIsFlushing(true);
    try {
      await updateMutation.mutateAsync({
        requestId: normalizedRequestId,
        playerOneScores: input.playerOneScores,
        playerTwoScores: input.playerTwoScores,
      });
      setSyncError(null);
      lastSyncedDraftKeyRef.current = keyToSend;
      setLastSyncedDraftKey(keyToSend);

      if (latestDraftKeyRef.current !== keyToSend) {
        flushInFlightRef.current = false;
        setIsFlushing(false);
        await runFlush();
        return;
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Could not update QR session scores";
      setSyncError(message);
      onSyncError?.(message);
    } finally {
      flushInFlightRef.current = false;
      setIsFlushing(false);
    }
  }, [buildInput, enabled, normalizedRequestId, onSyncError, updateMutation]);

  const scheduleSync = useCallback(() => {
    if (!enabled || !normalizedRequestId) return;
    clearDebounce();
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      void runFlush();
    }, DEBOUNCE_MS);
  }, [clearDebounce, enabled, normalizedRequestId, runFlush]);

  const markSynced = useCallback(
    (key: string) => {
      clearDebounce();
      lastSyncedDraftKeyRef.current = key;
      setLastSyncedDraftKey(key);
      setSyncError(null);
    },
    [clearDebounce],
  );

  const resetSync = useCallback(() => {
    clearDebounce();
    lastSyncedDraftKeyRef.current = null;
    setLastSyncedDraftKey(null);
    setSyncError(null);
  }, [clearDebounce]);

  useEffect(() => {
    if (!enabled) {
      resetSync();
      return;
    }
    if (!isDirty) return;
    scheduleSync();
  }, [enabled, isDirty, draftKey, scheduleSync, resetSync]);

  useEffect(() => () => clearDebounce(), [clearDebounce]);

  return {
    isDirty,
    isSyncing: updateMutation.isPending || isFlushing,
    lastSyncedDraftKey,
    markSynced,
    resetSync,
    syncError,
    flushNow: runFlush,
  };
}
