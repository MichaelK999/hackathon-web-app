// src/components/flashcards/TypeBadge.tsx
import type { CardType } from "@/lib/flashcard-types";

const colors: Record<CardType, { bg: string; color: string }> = {
  Basic:             { bg: "rgba(113,113,122,0.15)", color: "#a1a1aa" },
  Cloze:             { bg: "rgba(129,140,248,0.10)", color: "#818cf8" },
  "Multiple Choice": { bg: "rgba(52,211,153,0.10)",  color: "#34d399" },
  "True/False":      { bg: "rgba(251,191,36,0.10)",  color: "#fbbf24" },
};

export function TypeBadge({ type }: { type: CardType }) {
  const c = colors[type];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      fontSize: 11, fontWeight: 500, letterSpacing: "0.08em",
      textTransform: "uppercase", padding: "4px 10px", borderRadius: 6,
      background: c.bg, color: c.color,
    }}>
      {type}
    </span>
  );
}