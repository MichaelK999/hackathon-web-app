// src/components/flashcards/StudySession.tsx
"use client";

import type { Card, Deck } from "@/lib/flashcard-types";
import { useStudySession } from "@/hooks/useStudySession";
import { ProgressBar } from "./ProgressBar";
import { Flashcard } from "./Flashcard";

const font = '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif';
const mono = '"JetBrains Mono", "SF Mono", monospace';

interface Props {
  deck: Deck & { card_count?: number };
  cards: Card[];
  onBack: () => void;
}

export function StudySession({ deck, cards, onBack }: Props) {
  const { state, currentCard, reveal, answer, restart, correctCount, incorrectCount } =
    useStudySession(cards);

  // ─── Results ─────────────────────────────────────────
  if (state.finished) {
    const pct = Math.round((correctCount / cards.length) * 100);
    const col = pct >= 70 ? "#34d399" : pct >= 40 ? "#fbbf24" : "#f87171";

    return (
      <div className="anim-fade" style={{ maxWidth: 440, margin: "0 auto", padding: "40px 24px 64px", fontFamily: font }}>
        <button onClick={onBack} style={backStyle}>← All decks</button>

        <div style={{ textAlign: "center", marginTop: 96 }}>
          <p style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.1em", color: "#52525b", fontWeight: 500, marginBottom: 12 }}>
            Session complete
          </p>
          <div style={{ fontSize: 80, fontWeight: 700, color: col, lineHeight: 1, fontFamily: mono }}>
            {pct}%
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 20, fontSize: 14, color: "#71717a" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#34d399", display: "inline-block" }} />
              {correctCount} correct
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f87171", display: "inline-block" }} />
              {incorrectCount} incorrect
            </span>
          </div>
          <p style={{ color: "#52525b", marginTop: 4, fontSize: 14 }}>{deck.topic_label}</p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 48 }}>
            <button onClick={restart} style={primaryBtn}>↻ Study again</button>
            <button onClick={onBack} style={secondaryBtn}>Back to decks</button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentCard) return null;

  return (
    <div className="anim-fade" style={{ maxWidth: 620, margin: "0 auto", padding: "32px 24px 64px", fontFamily: font }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <button onClick={onBack} style={backStyle}>← {deck.topic_label}</button>
        <span style={{ fontSize: 13, color: "#52525b", fontFamily: mono }}>
          {state.currentIndex + 1} / {cards.length}
        </span>
      </div>

      <ProgressBar current={state.currentIndex} total={cards.length} results={state.results} />

      <div style={{ marginTop: 32 }}>
        <Flashcard card={currentCard} revealed={state.revealed} />
      </div>

      <div style={{ marginTop: 24 }}>
        {!state.revealed ? (
          <button onClick={reveal} style={{ ...primaryBtn, width: "100%", padding: "14px 0", fontSize: 15 }}>
            Show answer
            <span style={{ marginLeft: 10, fontSize: 11, background: "#d4d4d8", color: "#71717a", padding: "2px 8px", borderRadius: 4, fontWeight: 400 }}>
              space
            </span>
          </button>
        ) : (
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => answer("incorrect")} style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              padding: "14px 0", fontSize: 15, fontWeight: 500, borderRadius: 12, cursor: "pointer",
              background: "rgba(248,113,113,0.06)", color: "#f87171",
              border: "1px solid rgba(248,113,113,0.15)", fontFamily: font,
            }}>
              ✕ Again
              <span style={{ fontSize: 11, opacity: 0.4, background: "rgba(248,113,113,0.1)", padding: "2px 6px", borderRadius: 4 }}>1</span>
            </button>
            <button onClick={() => answer("correct")} style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              padding: "14px 0", fontSize: 15, fontWeight: 500, borderRadius: 12, cursor: "pointer",
              background: "rgba(52,211,153,0.06)", color: "#34d399",
              border: "1px solid rgba(52,211,153,0.15)", fontFamily: font,
            }}>
              ✓ Got it
              <span style={{ fontSize: 11, opacity: 0.4, background: "rgba(52,211,153,0.1)", padding: "2px 6px", borderRadius: 4 }}>2</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const backStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6,
  fontSize: 13, color: "#71717a", background: "none", border: "none",
  cursor: "pointer", padding: 0, fontFamily: '"DM Sans", sans-serif',
};
const primaryBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  padding: "10px 20px", fontSize: 14, fontWeight: 600,
  background: "#f4f4f5", color: "#18181b", border: "none", borderRadius: 10,
  cursor: "pointer", fontFamily: '"DM Sans", sans-serif',
};
const secondaryBtn: React.CSSProperties = {
  padding: "10px 20px", fontSize: 14, fontWeight: 500,
  background: "transparent", color: "#a1a1aa", border: "1px solid #27272a",
  borderRadius: 10, cursor: "pointer", fontFamily: '"DM Sans", sans-serif',
};