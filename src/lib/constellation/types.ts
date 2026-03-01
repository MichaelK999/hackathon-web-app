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
  /** Zoom level when focused on a subcategory */
  subFocusZoom: number;
  /** Zoom threshold below which we auto-unfocus */
  unfocusZoomThreshold: number;
  /** Padding multiplier for dynamic focus zoom (larger = more zoomed out) */
  focusZoomPadding: number;
  /** Nebula cloud effect settings */
  nebula: {
    /** Opacity at overview zoom level */
    overviewOpacity: number;
    /** Scale multiplier relative to constellation radius */
    scaleMultiplier: number;
    /** CSS color for the nebula glow */
    color: string;
    /** Gradient softness (0–1, lower = harder edge) */
    softness: number;
  };
}

export const DEFAULT_CONFIG: RendererConfig = {
  background: 0x08051a,
  backgroundStarCount: 12000,
  bloom: { strength: 0.35, radius: 0.3, threshold: 0.6 },
  zoomDuration: 800,
  focusZoom: 3.0,
  /** Zoom level when focused on a subcategory within a constellation */
  subFocusZoom: 6.0,
  unfocusZoomThreshold: 1.2,
  focusZoomPadding: 2.5,
  nebula: {
    overviewOpacity: 0.18,
    scaleMultiplier: 3.5,
    color: "#b08aff",
    softness: 0.35,
  },
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
  /** For topics, the ID of the parent subcategory. */
  parentSubId?: string;
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
  radius: number;
  group: THREE.Group;
  stars: StarMesh[];
  lines: LineMesh[];
  labels: LabelSprite[];
  rootLabel: LabelSprite | null;
  nebula: THREE.Sprite | null;
}

export interface StarMesh {
  sprite: THREE.Sprite;
  node: GraphNode;
  type: "subcategory" | "topic";
  baseScale: number;
  phase: number;
  /** For topic stars, the ID of the parent subcategory. */
  parentSubId?: string;
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
  /** For subcategory/topic labels, the associated subcategory ID. */
  subId?: string;
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
