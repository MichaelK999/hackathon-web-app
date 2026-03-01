// src/lib/flashcard-types.ts

export type CardType = "Basic" | "Cloze" | "Multiple Choice" | "True/False";

export interface Card {
  id: number;
  deck_id: number;
  card_type: CardType;
  question: string;
  answer: string;
  extra: string | null;
  created_at: string;
}

export interface Deck {
  id: number;
  user_id: string;
  topic_label: string;
  created_at: string;
}

export interface DeckListItem extends Deck {
  card_count: number;
}

export interface DeckWithCards {
  deck: Deck;
  cards: Card[];
}

export interface StudyState {
  currentIndex: number;
  revealed: boolean;
  results: ("correct" | "incorrect" | null)[];
  finished: boolean;
}