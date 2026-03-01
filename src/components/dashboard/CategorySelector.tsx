"use client";

import { useMemo, useState } from "react";
import type { ScanResult } from "@/lib/types";

interface CategorySelectorProps {
  scanResult: ScanResult;
  onContinue: (excludedCategories: string[]) => void;
}

export function CategorySelector({
  scanResult,
  onContinue,
}: CategorySelectorProps) {
  // Default: all flagged categories are excluded (conservative opt-in)
  const allCategoryIds = useMemo(
    () => scanResult.categories.map((c) => c.id),
    [scanResult],
  );
  const [excluded, setExcluded] = useState<Set<string>>(
    () => new Set(allCategoryIds),
  );
  const [submitting, setSubmitting] = useState(false);

  const piiCategories = scanResult.categories.filter(
    (c) => c.source === "gliner",
  );
  const safetyCategories = scanResult.categories.filter(
    (c) => c.source === "nemoguard",
  );

  // Count conversations that will proceed
  const excludedUuids = useMemo(() => {
    const uuids = new Set<string>();
    for (const [uuid, flags] of Object.entries(
      scanResult.conversation_flags,
    )) {
      if (flags.some((f) => excluded.has(f))) {
        uuids.add(uuid);
      }
    }
    return uuids;
  }, [excluded, scanResult]);

  const proceedCount = scanResult.total_conversations - excludedUuids.size;

  const toggleCategory = (id: string) => {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const excludeAll = () => setExcluded(new Set(allCategoryIds));
  const includeAll = () => setExcluded(new Set());

  const handleContinue = () => {
    setSubmitting(true);
    onContinue(Array.from(excluded));
  };

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Privacy Review
      </h2>

      <p className="text-xs text-muted-foreground">
        {scanResult.flagged_conversations} of {scanResult.total_conversations}{" "}
        conversations flagged. Toggle categories to include or exclude them from
        analysis.
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={includeAll}
          className="rounded border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted/50"
        >
          Include All
        </button>
        <button
          type="button"
          onClick={excludeAll}
          className="rounded border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted/50"
        >
          Exclude All
        </button>
      </div>

      {piiCategories.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground">
            Personal Information (PII)
          </h3>
          {piiCategories.map((cat) => (
            <label
              key={cat.id}
              className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!excluded.has(cat.id)}
                  onChange={() => toggleCategory(cat.id)}
                  className="h-3.5 w-3.5 rounded border-border accent-primary"
                />
                <span className="text-foreground">{cat.name}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {cat.conversation_count}
              </span>
            </label>
          ))}
        </div>
      )}

      {safetyCategories.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground">
            Content Safety
          </h3>
          {safetyCategories.map((cat) => (
            <label
              key={cat.id}
              className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!excluded.has(cat.id)}
                  onChange={() => toggleCategory(cat.id)}
                  className="h-3.5 w-3.5 rounded border-border accent-primary"
                />
                <span className="text-foreground">{cat.name}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {cat.conversation_count}
              </span>
            </label>
          ))}
        </div>
      )}

      <div className="rounded-md bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        {proceedCount} of {scanResult.total_conversations} conversations will
        proceed to analysis
      </div>

      <button
        type="button"
        onClick={handleContinue}
        disabled={submitting || proceedCount === 0}
        className="w-full rounded-lg border border-[#4a6fa5]/30 bg-[#08051a] px-4 py-2.5 text-center text-sm font-medium text-[#7eb4e2] transition-colors hover:border-[#4a6fa5]/60 hover:text-[#a0c4ff] disabled:pointer-events-none disabled:opacity-60"
      >
        {submitting ? "Continuing..." : "Continue Pipeline"}
      </button>
    </div>
  );
}
