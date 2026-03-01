// src/components/flashcards/ClozeText.tsx
"use client";

export function ClozeText({ text, revealed }: { text: string; revealed: boolean }) {
  const parts = text.split(/(\{\{c\d+::.*?\}\})/g);
  return (
    <span>
      {parts.map((part, i) => {
        const m = part.match(/\{\{c\d+::(.*?)\}\}/);
        if (m) {
          return revealed ? (
            <span key={i} className="cloze-revealed">{m[1]}</span>
          ) : (
            <span key={i} className="cloze-hidden">&nbsp;</span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}