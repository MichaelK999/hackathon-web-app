// src/components/flashcards/Flashcard.tsx
"use client";

import type { Card } from "@/lib/flashcard-types";
import { TypeBadge } from "./TypeBadge";
import { ClozeText } from "./ClozeText";

interface Props {
  card: Card;
  revealed: boolean;
}

function parseMultipleChoice(question: string) {
  const lines = question.split("\n").map((l) => l.trim()).filter(Boolean);
  const questionText = lines[0];
  const options = lines.slice(1);
  return { questionText, options };
}

export function Flashcard({ card, revealed }: Props) {
  const isMC = card.card_type === "Multiple Choice";
  const isTF = card.card_type === "True/False";
  const isCloze = card.card_type === "Cloze";

  const mc = isMC ? parseMultipleChoice(card.question) : null;
  const correctLetter = isMC ? card.answer.charAt(0) : null;

  const tfQuestion = isTF
    ? card.question.replace(/\s*True or False\??\s*$/i, "")
    : null;

  return (
    <div style={{
      borderRadius: 16, border: "1px solid rgba(39,39,42,0.6)",
      background: "rgba(17,17,19,0.5)", padding: "32px 32px 36px",
      minHeight: 280, display: "flex", flexDirection: "column",
    }}>
      <TypeBadge type={card.card_type} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", marginTop: 24 }}>

        {/* Cloze */}
        {isCloze && (
          <p style={{ fontSize: 17, fontWeight: 500, color: "#e4e4e7", lineHeight: 1.7 }}>
            <ClozeText text={card.question} revealed={revealed} />
          </p>
        )}

        {/* Multiple Choice */}
        {isMC && mc && (
          <>
            <p style={{ fontSize: 17, fontWeight: 500, color: "#e4e4e7", lineHeight: 1.7, marginBottom: 20 }}>
              {mc.questionText}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {mc.options.map((opt, i) => {
                const letter = opt.charAt(0);
                const isCorrect = revealed && letter === correctLetter;
                const isWrong = revealed && letter !== correctLetter;
                return (
                  <div key={i} style={{
                    padding: "12px 16px", borderRadius: 10,
                    border: `1px solid ${isCorrect ? "rgba(52,211,153,0.3)" : "rgba(39,39,42,0.6)"}`,
                    background: isCorrect ? "rgba(52,211,153,0.08)" : "rgba(24,24,27,0.4)",
                    color: isCorrect ? "#34d399" : isWrong && revealed ? "#52525b" : "#a1a1aa",
                    fontSize: 15, lineHeight: 1.5, transition: "all 0.2s",
                  }}>
                    {opt}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* True / False */}
        {isTF && (
          <>
            <p style={{ fontSize: 17, fontWeight: 500, color: "#e4e4e7", lineHeight: 1.7, marginBottom: 20 }}>
              {tfQuestion}
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              {(["True", "False"] as const).map((val) => {
                const isAnswer = card.answer === val;
                const isCorrect = revealed && isAnswer;
                const isWrong = revealed && !isAnswer;
                return (
                  <div key={val} style={{
                    flex: 1, padding: "12px 16px", borderRadius: 10, textAlign: "center",
                    border: `1px solid ${isCorrect ? "rgba(52,211,153,0.3)" : "rgba(39,39,42,0.6)"}`,
                    background: isCorrect ? "rgba(52,211,153,0.08)" : "rgba(24,24,27,0.4)",
                    color: isCorrect ? "#34d399" : isWrong ? "#52525b" : "#a1a1aa",
                    fontSize: 15, fontWeight: 500, transition: "all 0.2s",
                  }}>
                    {val}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Basic */}
        {card.card_type === "Basic" && (
          <p style={{ fontSize: 17, fontWeight: 500, color: "#e4e4e7", lineHeight: 1.7, whiteSpace: "pre-line" }}>
            {card.question}
          </p>
        )}

        {/* Answer (Basic only) */}
        {revealed && card.card_type === "Basic" && (
          <div className="anim-fade" style={{
            marginTop: 28, paddingTop: 24,
            borderTop: "1px solid rgba(39,39,42,0.6)",
          }}>
            <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "#52525b", fontWeight: 500, marginBottom: 8 }}>
              Answer
            </p>
            <p style={{ fontSize: 15, color: "#a1a1aa", lineHeight: 1.7 }}>
              {card.answer}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}