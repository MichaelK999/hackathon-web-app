// src/hooks/useStudySession.ts
"use client";

import { useState, useCallback, useEffect } from "react";
import type { Card, StudyState } from "@/lib/flashcard-types";

export function useStudySession(cards: Card[]) {
  const [state, setState] = useState<StudyState>({
    currentIndex: 0,
    revealed: false,
    results: new Array(cards.length).fill(null),
    finished: false,
  });

  const currentCard = cards[state.currentIndex] ?? null;

  const reveal = useCallback(() => {
    setState((s) => ({ ...s, revealed: true }));
  }, []);

  const answer = useCallback(
    (result: "correct" | "incorrect") => {
      setState((s) => {
        const newResults = [...s.results];
        newResults[s.currentIndex] = result;
        const nextIndex = s.currentIndex + 1;
        const isFinished = nextIndex >= cards.length;
        return {
          results: newResults,
          currentIndex: isFinished ? s.currentIndex : nextIndex,
          revealed: false,
          finished: isFinished,
        };
      });
    },
    [cards.length]
  );

  const restart = useCallback(() => {
    setState({
      currentIndex: 0,
      revealed: false,
      results: new Array(cards.length).fill(null),
      finished: false,
    });
  }, [cards.length]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (state.finished) return;
      if (!state.revealed && e.key === " ") {
        e.preventDefault();
        reveal();
      }
      if (state.revealed) {
        if (e.key === "1" || e.key === "ArrowLeft") answer("incorrect");
        if (e.key === "2" || e.key === "ArrowRight") answer("correct");
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [state.revealed, state.finished, reveal, answer]);

  return {
    state,
    currentCard,
    reveal,
    answer,
    restart,
    correctCount: state.results.filter((r) => r === "correct").length,
    incorrectCount: state.results.filter((r) => r === "incorrect").length,
  };
}