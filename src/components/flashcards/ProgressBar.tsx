// src/components/flashcards/ProgressBar.tsx
"use client";

interface Props {
  current: number;
  total: number;
  results: ("correct" | "incorrect" | null)[];
}

export function ProgressBar({ current, total, results }: Props) {
  return (
    <div style={{ display: "flex", gap: 4, width: "100%" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          flex: 1, height: 3, borderRadius: 4,
          transition: "background-color 0.3s",
          backgroundColor:
            results[i] === "correct" ? "#34d399" :
            results[i] === "incorrect" ? "#f87171" :
            i === current ? "#71717a" : "#27272a",
        }} />
      ))}
    </div>
  );
}