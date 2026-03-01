import type * as THREE from "three";
import type { GraphData, GraphNode } from "@/lib/types";

// ── Renderer configuration ─────────────────────────────────

export interface RendererConfig {
  /** Background color (hex) */
  background: number;
  /** Number of ambient background stars */
  backgroundStarCount: number;
  /** Bloom pass parameters */
  bloom: {
    strength: number;
    radius: number;
    threshold: number;
  };
  /** Camera zoom animation duration in ms */
  zoomDuration: number;
  /** Zoom level when focused on a constellation */
  focusZoom: number;
  /** Zoom threshold below which we auto-unfocus */
  unfocusZoomThreshold: number;
}

export const DEFAULT_CONFIG: RendererConfig = {
  background: 0x08051a,
  backgroundStarCount: 2000,
  bloom: { strength: 0.7, radius: 0.5, threshold: 0.45 },
  zoomDuration: 800,
  focusZoom: 3.0,
  unfocusZoomThreshold: 1.2,
};

// ── Color palette ───────────────────────────────────────────

export const PALETTE = {
  // Thaumcraft violet + Astral gold
  rootLabel: 0xe0d4ff,
  subcategory: 0xb08aff,
  topic: 0xffcc66,
  connection: 0x7a5cbf,
  backgroundStar: 0x8878aa,

  rootLabelCSS: "#e0d4ff",
  subcategoryCSS: "#b08aff",
  topicCSS: "#ffcc66",
} as const;

// ── Layout types ────────────────────────────────────────────

export interface Vec2 {
  x: number;
  y: number;
}

/** A positioned node with its computed world-space coordinates. */
export interface PositionedNode {
  node: GraphNode;
  /** Position relative to constellation center. */
  local: Vec2;
  /** Absolute world-space position. */
  world: Vec2;
}

/** A connection line between two positioned nodes. */
export interface PositionedLink {
  from: Vec2;
  to: Vec2;
  /** Whether this is a structural (sub-to-sub) or content (sub-to-topic) link. */
  kind: "structural" | "content";
}

/** Layout result for a single constellation. */
export interface ConstellationLayout {
  rootId: string;
  rootName: string;
  center: Vec2;
  subcategories: PositionedNode[];
  topics: PositionedNode[];
  links: PositionedLink[];
  /** Bounding radius from center (for camera framing). */
  radius: number;
}

/** Complete layout result. */
export interface SceneLayout {
  constellations: ConstellationLayout[];
  /** Overall bounding radius from origin. */
  totalRadius: number;
}

// ── Rendering types ─────────────────────────────────────────

/** Mutable Three.js objects for a single constellation. */
export interface ConstellationSceneGroup {
  rootId: string;
  rootName: string;
  center: Vec2;
  group: THREE.Group;
  stars: StarMesh[];
  lines: LineMesh[];
  labels: LabelSprite[];
  rootLabel: LabelSprite | null;
}

export interface StarMesh {
  sprite: THREE.Sprite;
  node: GraphNode;
  type: "subcategory" | "topic";
  baseScale: number;
  phase: number;
}

export interface LineMesh {
  line: THREE.Line;
  kind: "structural" | "content";
  baseOpacity: number;
}

export interface LabelSprite {
  sprite: THREE.Sprite;
  /** Whether this label is only visible when zoomed into the constellation. */
  zoomOnly: boolean;
}

// ── Camera animation state ──────────────────────────────────

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
}

// ── Callbacks ───────────────────────────────────────────────

export interface RendererCallbacks {
  /** Called when a topic node is clicked. */
  onTopicClick?: (node: GraphNode) => void;
  /** Called when hover state changes. Null means nothing hovered. */
  onHover?: (node: GraphNode | null) => void;
}

// ── Re-exports ──────────────────────────────────────────────

export type { GraphData, GraphNode };
