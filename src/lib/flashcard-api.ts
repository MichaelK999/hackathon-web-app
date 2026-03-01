// src/lib/flashcard-api.ts
//
// Cookie-based auth — sends Supabase SSR cookies automatically.
// No Bearer token / localStorage needed.

import type { DeckListItem, DeckWithCards } from "./flashcard-types";

function getApiBase(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base)
    throw new Error("NEXT_PUBLIC_API_BASE_URL environment variable is not set");
  return base;
}

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`${getApiBase()}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || `Request failed (${res.status})`);
  }
  return res;
}

// ─── List all decks ────────────────────────────────────────
export async function listDecks(): Promise<DeckListItem[]> {
  const res = await apiFetch("/api/decks");
  const data = await res.json();
  return data.decks;
}

// ─── Get single deck with cards ────────────────────────────
export async function getDeck(deckId: number): Promise<DeckWithCards> {
  const res = await apiFetch(`/api/decks/${deckId}`);
  return res.json();
}

// ─── Create deck from raw text / notes ─────────────────────
export async function createDeck(
  label: string,
  content: string = ""
): Promise<{ deck_id: number; card_count: number }> {
  const res = await apiFetch("/api/decks", {
    method: "POST",
    body: JSON.stringify({ label, content }),
  });
  return res.json();
}

// ─── Generate deck from a pipeline topic ───────────────────
export async function createDeckFromTopic(
  topicLabel: string
): Promise<{ deck_id: number; topic_label: string; card_count: number }> {
  const res = await apiFetch(
    `/api/decks/from-topic/${encodeURIComponent(topicLabel)}`,
    { method: "POST" }
  );
  return res.json();
}

// ─── Delete a deck ─────────────────────────────────────────
export async function deleteDeck(deckId: number): Promise<void> {
  await apiFetch(`/api/decks/${deckId}`, { method: "DELETE" });
}