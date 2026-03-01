"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface PipelineControlsProps {
  onStart: (params: {
    session_key: string;
    last_active_org: string;
  }) => void;
  isRunning: boolean;
}

export function PipelineControls({ onStart, isRunning }: PipelineControlsProps) {
  const [sessionKey, setSessionKey] = useState("");
  const [orgId, setOrgId] = useState("");

  const canSubmit = sessionKey.trim() && orgId.trim() && !isRunning;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onStart({
      session_key: sessionKey.trim(),
      last_active_org: orgId.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <Button type="submit" disabled={!canSubmit} className="w-full">
        {isRunning ? "Processing..." : "Start Processing"}
      </Button>
    </form>
  );
}
