// src/components/flashcards/EmptyState.tsx
"use client";

export function EmptyState({ onCreateDeck }: { onCreateDeck: () => void }) {
  return (
    <div className="anim-fade" style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "112px 0", textAlign: "center",
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 16,
        background: "rgba(24,24,27,0.6)", border: "1px solid #27272a",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 20, fontSize: 24, color: "#52525b",
      }}>
        ☐
      </div>
      <h2 style={{ fontSize: 16, fontWeight: 500, color: "#d4d4d8", marginBottom: 4 }}>
        No decks yet
      </h2>
      <p style={{ fontSize: 14, color: "#52525b", marginBottom: 32, maxWidth: 240 }}>
        Create your first deck to start studying flashcards.
      </p>
      <button onClick={onCreateDeck} style={{
        padding: "10px 20px", fontSize: 14, fontWeight: 500,
        background: "#f4f4f5", color: "#18181b", border: "none",
        borderRadius: 10, cursor: "pointer",
      }}>
        Create deck
      </button>
    </div>
  );
}