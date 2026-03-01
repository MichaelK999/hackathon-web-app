// src/components/flashcards/CreateDeckModal.tsx
"use client";

import { useState, useRef, useEffect } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (label: string, content: string) => Promise<void>;
}

export function CreateDeckModal({ open, onClose, onSubmit }: Props) {
  const [label, setLabel] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
    else { setLabel(""); setContent(""); setError(null); }
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  async function handleSubmit() {
    if (!label.trim()) return;
    setLoading(true); setError(null);
    try { await onSubmit(label.trim(), content.trim()); onClose(); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Something went wrong"); }
    finally { setLoading(false); }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 16px", fontSize: 14,
    background: "rgba(24,24,27,0.6)", border: "1px solid #27272a",
    borderRadius: 12, color: "#e4e4e7", outline: "none",
    fontFamily: '"DM Sans", sans-serif',
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }} />

      <div className="anim-scale" style={{
        position: "relative", width: "100%", maxWidth: 480,
        background: "#111113", border: "1px solid rgba(39,39,42,0.6)",
        borderRadius: 16, boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 24px 0" }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#e4e4e7" }}>New deck</h2>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: "#71717a",
            cursor: "pointer", fontSize: 18, padding: 4,
          }}>✕</button>
        </div>

        <div style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "#52525b", fontWeight: 500, marginBottom: 8 }}>
              Topic
            </label>
            <input
              ref={inputRef} type="text" value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Cell Biology"
              onKeyDown={(e) => { if (e.key === "Enter" && label.trim()) handleSubmit(); }}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "#52525b", fontWeight: 500, marginBottom: 8 }}>
              Study material <span style={{ color: "#3f3f46", textTransform: "none", letterSpacing: 0 }}>(optional)</span>
            </label>
            <textarea
              value={content} onChange={(e) => setContent(e.target.value)}
              rows={5} placeholder="Paste notes, conversation excerpts, or study material..."
              style={{ ...inputStyle, resize: "none" as const }}
            />
          </div>

          {error && (
            <p style={{ fontSize: 14, color: "#f87171", background: "rgba(248,113,113,0.05)", border: "1px solid rgba(248,113,113,0.1)", borderRadius: 8, padding: "8px 12px" }}>
              {error}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !label.trim()}
            style={{
              width: "100%", padding: "12px 0", fontSize: 14, fontWeight: 600,
              background: loading || !label.trim() ? "#52525b" : "#f4f4f5",
              color: loading || !label.trim() ? "#27272a" : "#18181b",
              border: "none", borderRadius: 12, cursor: loading || !label.trim() ? "not-allowed" : "pointer",
              fontFamily: '"DM Sans", sans-serif',
            }}
          >
            {loading ? "Generating cards..." : "Create deck"}
          </button>
        </div>
      </div>
    </div>
  );
}