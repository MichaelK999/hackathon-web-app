// src/app/flashcards/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { DeckCard } from "@/components/flashcards/DeckCard";
import { EmptyState } from "@/components/flashcards/EmptyState";
import { CreateDeckModal } from "@/components/flashcards/CreateDeckModal";
import { StudySession } from "@/components/flashcards/StudySession";
import type { Card, DeckListItem } from "@/lib/flashcard-types";
import { listDecks, getDeck, createDeck, createDeckFromTopic, deleteDeck } from "@/lib/flashcard-api";

const font = '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif';

// ─── Types for pipeline tree data ──────────────────────────
interface TreeTopic {
  label: string;
  keywords: string[];
  segment_count: number;
}
interface TreeSubcategory {
  name: string;
  topics: TreeTopic[];
  segment_count: number;
}
interface TreeRoot {
  name: string;
  subcategories: TreeSubcategory[];
  segment_count: number;
}

function getApiBase(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
}

export default function FlashcardsPage() {
  const [view, setView] = useState<"decks" | "study" | "topics">("decks");
  const [decks, setDecks] = useState<DeckListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Study state
  const [activeDeck, setActiveDeck] = useState<DeckListItem | null>(null);
  const [activeCards, setActiveCards] = useState<Card[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);

  // Pipeline topics state
  const [tree, setTree] = useState<TreeRoot[]>([]);
  const [loadingTree, setLoadingTree] = useState(false);
  const [generatingTopic, setGeneratingTopic] = useState<string | null>(null);

  // ─── Fetch decks on mount ────────────────────────────────
  const fetchDecks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listDecks();
      setDecks(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load decks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDecks();
  }, [fetchDecks]);

  // ─── Fetch pipeline topic tree ───────────────────────────
  async function fetchTree() {
    try {
      setLoadingTree(true);
      const res = await fetch(`${getApiBase()}/api/tree`, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 404) {
          setTree([]);
          return;
        }
        throw new Error("Failed to load topics");
      }
      const data: TreeRoot[] = await res.json();
      setTree(data);
    } catch {
      setTree([]);
    } finally {
      setLoadingTree(false);
    }
  }

  // ─── Start studying a deck ───────────────────────────────
  async function startStudy(deck: DeckListItem) {
    try {
      setLoadingCards(true);
      const data = await getDeck(deck.id);
      setActiveDeck(deck);
      setActiveCards(data.cards);
      setView("study");
    } catch {
      setError("Failed to load cards");
    } finally {
      setLoadingCards(false);
    }
  }

  function goBack() {
    setView("decks");
    setActiveDeck(null);
    setActiveCards([]);
    fetchDecks();
  }

  // ─── Create deck via modal (raw text) ────────────────────
  async function handleCreateDeck(label: string, content: string) {
    await createDeck(label, content);
    await fetchDecks();
  }

  // ─── Delete a deck ──────────────────────────────────────
  async function handleDeleteDeck(deckId: number) {
    try {
      await deleteDeck(deckId);
      await fetchDecks();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete deck");
    }
  }

  // ─── Generate deck from pipeline topic ───────────────────
  async function handleGenerateFromTopic(topicLabel: string) {
    try {
      setGeneratingTopic(topicLabel);
      setError(null);
      await createDeckFromTopic(topicLabel);
      await fetchDecks();
      setView("decks");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to generate deck");
    } finally {
      setGeneratingTopic(null);
    }
  }

  // ─── Show topic picker ──────────────────────────────────
  function showTopicPicker() {
    setView("topics");
    if (tree.length === 0) fetchTree();
  }

  // ─── Study view ──────────────────────────────────────────
  if (view === "study" && activeDeck && activeCards.length > 0) {
    return (
      <div className="min-h-screen bg-[#09090b]">
        <StudySession deck={activeDeck} cards={activeCards} onBack={goBack} />
      </div>
    );
  }

  // ─── Topic picker view ──────────────────────────────────
  if (view === "topics") {
    return (
      <div className="min-h-screen bg-[#09090b]">
        <div className="anim-fade" style={{
          maxWidth: 620, margin: "0 auto", padding: "40px 24px 80px", fontFamily: font,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
            <button
              onClick={() => setView("decks")}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                fontSize: 13, color: "#71717a", background: "none", border: "none",
                cursor: "pointer", padding: 0, fontFamily: font,
              }}
            >
              ← Back to decks
            </button>
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fafafa", marginBottom: 8 }}>
            Generate from your conversations
          </h2>
          <p style={{ fontSize: 14, color: "#52525b", marginBottom: 32 }}>
            Select a topic from your pipeline results to auto-generate a flashcard deck.
          </p>

          {error && (
            <div style={{
              padding: "12px 16px", borderRadius: 10, marginBottom: 20,
              background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.15)",
              color: "#f87171", fontSize: 14,
            }}>
              {error}
            </div>
          )}

          {loadingTree && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{
                  height: 48, borderRadius: 12,
                  background: "rgba(24,24,27,0.4)", border: "1px solid rgba(39,39,42,0.3)",
                  animation: "pulse 2s infinite",
                }} />
              ))}
              <style>{`@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.5 } }`}</style>
            </div>
          )}

          {!loadingTree && tree.length === 0 && (
            <div style={{ textAlign: "center", padding: "64px 0" }}>
              <p style={{ color: "#52525b", fontSize: 14 }}>
                No pipeline results yet. Run the pipeline from the dashboard first.
              </p>
            </div>
          )}

          {!loadingTree && tree.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {tree.map((root) => (
                <div key={root.name}>
                  <h3 style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#71717a", marginBottom: 12 }}>
                    {root.name}
                  </h3>
                  {root.subcategories.map((sub) => (
                    <div key={sub.name} style={{ marginBottom: 16 }}>
                      <p style={{ fontSize: 12, color: "#52525b", marginBottom: 8, paddingLeft: 8 }}>
                        {sub.name}
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {sub.topics.map((topic) => {
                          const isGenerating = generatingTopic === topic.label;
                          const alreadyExists = decks.some(
                            (d) => d.topic_label === topic.label
                          );
                          return (
                            <button
                              key={topic.label}
                              onClick={() => !isGenerating && !alreadyExists && handleGenerateFromTopic(topic.label)}
                              disabled={isGenerating || alreadyExists}
                              style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                padding: "12px 16px", borderRadius: 10, width: "100%", textAlign: "left",
                                border: `1px solid ${alreadyExists ? "rgba(52,211,153,0.2)" : "rgba(39,39,42,0.6)"}`,
                                background: alreadyExists ? "rgba(52,211,153,0.04)" : "rgba(24,24,27,0.4)",
                                color: "#fafafa", cursor: isGenerating || alreadyExists ? "default" : "pointer",
                                fontFamily: font, transition: "all 0.2s",
                                opacity: isGenerating ? 0.6 : 1,
                              }}
                            >
                              <div>
                                <span style={{ fontSize: 14, fontWeight: 500, color: "#e4e4e7" }}>
                                  {topic.label}
                                </span>
                                <span style={{ fontSize: 12, color: "#52525b", marginLeft: 10 }}>
                                  {topic.segment_count} segments
                                </span>
                              </div>
                              <span style={{ fontSize: 12, color: alreadyExists ? "#34d399" : "#71717a", flexShrink: 0 }}>
                                {isGenerating
                                  ? "Generating..."
                                  : alreadyExists
                                  ? "✓ Created"
                                  : "Generate →"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Deck list view (default) ────────────────────────────
  const totalCards = decks.reduce((s, d) => s + d.card_count, 0);

  return (
    <div className="min-h-screen bg-[#09090b]">
      <div className="anim-fade" style={{
        maxWidth: 580, margin: "0 auto", padding: "40px 24px 80px", fontFamily: font,
      }}>
        {/* Back to dashboard */}
        <Link
          href="/dashboard"
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 13, color: "#71717a", textDecoration: "none",
            marginBottom: 32,
          }}
        >
          ← Dashboard
        </Link>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 40 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", color: "#fafafa", margin: 0 }}>
              Flashcards
            </h1>
            {!loading && (
              <p style={{ fontSize: 14, color: "#52525b", marginTop: 4 }}>
                {decks.length} {decks.length === 1 ? "deck" : "decks"} · {totalCards} cards
              </p>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={showTopicPicker}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "10px 14px", fontSize: 13, fontWeight: 500,
                background: "transparent", color: "#a1a1aa",
                border: "1px solid #27272a", borderRadius: 10, cursor: "pointer",
                fontFamily: font,
              }}
            >
              ✦ From topics
            </button>
            <button
              onClick={() => setModalOpen(true)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "10px 16px", fontSize: 13, fontWeight: 600,
                background: "#f4f4f5", color: "#18181b", border: "none",
                borderRadius: 10, cursor: "pointer", fontFamily: font,
              }}
            >
              + New deck
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: "12px 16px", borderRadius: 10, marginBottom: 20,
            background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.15)",
            color: "#f87171", fontSize: 14,
          }}>
            {error}
            <button onClick={fetchDecks} style={{
              marginLeft: 12, background: "none", border: "none",
              color: "#f87171", textDecoration: "underline", cursor: "pointer",
              fontSize: 14, fontFamily: font,
            }}>
              Retry
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{
                height: 72, borderRadius: 12,
                background: "rgba(24,24,27,0.4)", border: "1px solid rgba(39,39,42,0.3)",
                animation: "pulse 2s infinite",
              }} />
            ))}
            <style>{`@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.5 } }`}</style>
          </div>
        )}

        {/* Loading cards overlay */}
        {loadingCards && (
          <div style={{
            position: "fixed", inset: 0, zIndex: 40,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(9,9,11,0.8)", backdropFilter: "blur(4px)",
          }}>
            <p style={{ fontSize: 15, color: "#71717a" }}>Loading cards...</p>
          </div>
        )}

        {/* Deck list */}
        {!loading && decks.length === 0 && !error && (
          <EmptyState onCreateDeck={() => setModalOpen(true)} />
        )}

        {!loading && decks.length > 0 && (
          <div className="stagger" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {decks.map((deck) => (
              <div key={deck.id} className="anim-fade" style={{ position: "relative" }}>
                <DeckCard
                  topicLabel={deck.topic_label}
                  cardCount={deck.card_count}
                  createdAt={deck.created_at}
                  onClick={() => startStudy(deck)}
                />
                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete "${deck.topic_label}"?`)) {
                      handleDeleteDeck(deck.id);
                    }
                  }}
                  style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", color: "#3f3f46",
                    cursor: "pointer", fontSize: 14, padding: "4px 8px",
                    borderRadius: 6, transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#f87171")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#3f3f46")}
                  title="Delete deck"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {!loading && decks.length > 0 && (
          <p style={{ textAlign: "center", fontSize: 12, color: "#3f3f46", marginTop: 64 }}>
            Select a deck to start studying
          </p>
        )}

        <CreateDeckModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleCreateDeck}
        />
      </div>
    </div>
  );
}