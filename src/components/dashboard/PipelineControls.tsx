"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { countConversations } from "@/lib/api";

interface PipelineControlsProps {
  onStart: (params: {
    session_key: string;
    last_active_org: string;
    max_conversations?: number;
  }) => void;
  isRunning: boolean;
}

export function PipelineControls({ onStart, isRunning }: PipelineControlsProps) {
  const [sessionKey, setSessionKey] = useState("");
  const [orgId, setOrgId] = useState("");
  const [maxConvos, setMaxConvos] = useState("");
  const [isCounting, setIsCounting] = useState(false);
  const [countError, setCountError] = useState<string | null>(null);

  const fetchCount = useCallback(async () => {
    const key = sessionKey.trim();
    const org = orgId.trim();
    if (!key || !org) return;

    setIsCounting(true);
    setCountError(null);
    try {
      const count = await countConversations({
        session_key: key,
        last_active_org: org,
      });
      setMaxConvos(String(count));
    } catch (err) {
      setCountError(err instanceof Error ? err.message : "Failed to fetch count");
    } finally {
      setIsCounting(false);
    }
  }, [sessionKey, orgId]);

  // Auto-fetch count when both fields are filled
  useEffect(() => {
    if (!sessionKey.trim() || !orgId.trim()) return;
    const timeout = setTimeout(fetchCount, 500);
    return () => clearTimeout(timeout);
  }, [sessionKey, orgId, fetchCount]);

  const canSubmit = sessionKey.trim() && orgId.trim() && !isRunning && !isCounting;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const limit = parseInt(maxConvos, 10);
    onStart({
      session_key: sessionKey.trim(),
      last_active_org: orgId.trim(),
      max_conversations: Number.isNaN(limit) || limit <= 0 ? undefined : limit,
    });
  };

  return (
    <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Pipeline Controls
      </h2>

      <div className="space-y-1.5">
        <label htmlFor="session-key" className="text-sm text-muted-foreground">
          Session Key
        </label>
        <input
          id="session-key"
          type="password"
          value={sessionKey}
          onChange={(e) => setSessionKey(e.target.value)}
          placeholder="sk-ant-..."
          disabled={isRunning}
          autoComplete="off"
          data-1p-ignore
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="org-id" className="text-sm text-muted-foreground">
          Organization ID
        </label>
        <input
          id="org-id"
          type="text"
          value={orgId}
          onChange={(e) => setOrgId(e.target.value)}
          placeholder="org-uuid-here"
          disabled={isRunning}
          autoComplete="off"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="max-convos" className="text-sm text-muted-foreground">
          Max Conversations
          {isCounting && <span className="ml-2 text-xs opacity-60">fetching...</span>}
        </label>
        <input
          id="max-convos"
          type="number"
          value={maxConvos}
          onChange={(e) => setMaxConvos(e.target.value)}
          placeholder={isCounting ? "Loading..." : "Auto-detected from Claude"}
          min={1}
          disabled={isRunning}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {countError && (
          <p className="text-xs text-red-500">{countError}</p>
        )}
      </div>

      <Button type="submit" disabled={!canSubmit} className="w-full">
        {isRunning ? "Processing..." : "Start Processing"}
      </Button>
    </form>
  );
}
