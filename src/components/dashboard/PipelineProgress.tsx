"use client";

import type { PipelinePhase } from "@/lib/types";

const PHASE_LABELS: Record<PipelinePhase, string> = {
  fetching: "Fetching Conversations",
  scanning: "Scanning for Privacy",
  awaiting_review: "Review & Approve",
  embedding: "Embedding Messages",
  segmenting: "Segmenting Conversations",
  clustering: "Clustering Segments",
  labeling: "Labeling Topics",
  hierarchy: "Building Hierarchy",
  done: "Complete",
  error: "Error",
};

const PHASE_ORDER: PipelinePhase[] = [
  "fetching",
  "scanning",
  "awaiting_review",
  "embedding",
  "segmenting",
  "clustering",
  "labeling",
  "hierarchy",
];

interface PipelineProgressProps {
  phase: PipelinePhase | null;
  message: string;
  progress: number;
  error: string | null;
}

export function PipelineProgress({
  phase,
  message,
  progress,
  error,
}: PipelineProgressProps) {
  if (!phase) return null;

  const phaseIndex = phase ? PHASE_ORDER.indexOf(phase) : -1;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Progress
      </h2>

      {/* Progress bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary-foreground transition-all duration-300"
          style={{
            width: `${Math.round(
              phase === "done" ? 100 : progress * 100
            )}%`,
          }}
        />
      </div>

      {/* Phase indicator */}
      <p className="text-sm text-foreground">
        {phase === "done"
          ? "Pipeline complete!"
          : phase === "error"
            ? error ?? "An error occurred"
            : message}
      </p>

      {/* Phase steps */}
      <div className="space-y-1">
        {PHASE_ORDER.map((p, i) => {
          const isCurrent = p === phase;
          const isCompleted = phaseIndex > i || phase === "done";
          return (
            <div key={p} className="flex items-center gap-2 text-xs">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  isCompleted
                    ? "bg-green-500"
                    : isCurrent
                      ? "bg-primary-foreground animate-pulse"
                      : "bg-muted-foreground/30"
                }`}
              />
              <span
                className={
                  isCurrent
                    ? "font-medium text-foreground"
                    : isCompleted
                      ? "text-muted-foreground line-through"
                      : "text-muted-foreground/50"
                }
              >
                {PHASE_LABELS[p]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
