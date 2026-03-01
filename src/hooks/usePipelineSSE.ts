"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPipelineSSEUrl } from "@/lib/api";
import type { PipelinePhase, PipelineProgressEvent, ScanResult } from "@/lib/types";

export interface PipelineSSEState {
  phase: PipelinePhase | null;
  message: string;
  progress: number;
  isRunning: boolean;
  error: string | null;
  latestEvent: PipelineProgressEvent | null;
  scanResult: ScanResult | null;
  isAwaitingReview: boolean;
}

const INITIAL_STATE: PipelineSSEState = {
  phase: null,
  message: "",
  progress: 0,
  isRunning: false,
  error: null,
  latestEvent: null,
  scanResult: null,
  isAwaitingReview: false,
};

/**
 * Hook that connects to the pipeline SSE stream and tracks progress.
 * Call `connect(runId)` after starting a pipeline run.
 */
export function usePipelineSSE() {
  const [state, setState] = useState<PipelineSSEState>(INITIAL_STATE);
  const eventSourceRef = useRef<EventSource | null>(null);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const connect = useCallback(
    (runId: string) => {
      disconnect();
      setState({ ...INITIAL_STATE, isRunning: true });

      const url = createPipelineSSEUrl(runId);
      const es = new EventSource(url, { withCredentials: true });
      eventSourceRef.current = es;

      const handleEvent = (e: MessageEvent) => {
        try {
          const event: PipelineProgressEvent = JSON.parse(e.data);
          setState((prev) => ({
            ...prev,
            phase: event.phase,
            message: event.message,
            progress: event.progress,
            latestEvent: event,
            isRunning: event.phase !== "done" && event.phase !== "error",
            error: event.phase === "error" ? event.message : null,
            scanResult: event.scan_result ?? prev.scanResult,
            isAwaitingReview: event.phase === "awaiting_review",
          }));

          if (event.phase === "done" || event.phase === "error") {
            es.close();
            eventSourceRef.current = null;
          }
        } catch {
          // ignore malformed events
        }
      };

      // Listen to all phase event types
      const phases: PipelinePhase[] = [
        "fetching",
        "scanning",
        "awaiting_review",
        "embedding",
        "segmenting",
        "clustering",
        "labeling",
        "hierarchy",
        "done",
        "error",
      ];
      phases.forEach((phase) => es.addEventListener(phase, handleEvent));

      es.onerror = () => {
        setState((prev) => ({
          ...prev,
          isRunning: false,
          error: prev.error ?? "Connection lost",
        }));
        es.close();
        eventSourceRef.current = null;
      };
    },
    [disconnect]
  );

  // Clean up on unmount
  useEffect(() => {
    return () => disconnect();
  }, [disconnect]);

  const reset = useCallback(() => {
    disconnect();
    setState(INITIAL_STATE);
  }, [disconnect]);

  return { ...state, connect, disconnect, reset };
}
