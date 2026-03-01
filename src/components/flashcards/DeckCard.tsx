// src/components/flashcards/DeckCard.tsx
"use client";

import { useState } from "react";

interface Props {
  topicLabel: string;
  cardCount: number;
  createdAt: string;
  onClick: () => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export function DeckCard({ topicLabel, cardCount, createdAt, onClick }: Props) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 16, padding: "16px 20px", width: "100%", textAlign: "left",
        borderRadius: 12, cursor: "pointer",
        border: `1px solid ${hovered ? "rgba(63,63,70,0.8)" : "rgba(39,39,42,0.6)"}`,
        background: hovered ? "rgba(39,39,42,0.4)" : "rgba(24,24,27,0.4)",
        transition: "all 0.2s", color: "#fafafa",
        fontFamily: '"DM Sans", sans-serif',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: "#e4e4e7", lineHeight: 1.4, margin: 0 }}>
          {topicLabel}
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, fontSize: 13, color: "#52525b" }}>
          <span>{cardCount} cards</span>
          <span style={{ color: "#3f3f46" }}>·</span>
          <span>{formatDate(createdAt)}</span>
        </div>
      </div>
      <span style={{ color: "#52525b", flexShrink: 0, fontSize: 16 }}>›</span>
    </button>
  );
}