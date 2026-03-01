import type { GraphData, GraphNode } from "@/lib/types";
import type {
  ConstellationLayout,
  PositionedLink,
  PositionedNode,
  SceneLayout,
  Vec2,
} from "./types";

// ── Constants ───────────────────────────────────────────────

/**
 * Minimum spacing between constellation centers.
 * Scaled dynamically based on constellation count and content.
 */
const MIN_CONSTELLATION_SPACING = 300;

/** Base ring radius for subcategories around their root center. */
const SUB_RING_BASE = 100;

/** Distance topics scatter from their parent subcategory. */
const TOPIC_SCATTER_MIN = 40;
const TOPIC_SCATTER_MAX = 75;

// ── Helpers ─────────────────────────────────────────────────

/** Deterministic hash of a string → integer. */
export function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return h;
}

/** Hash normalized to [0, 1). */
function hashNorm(s: string, seed: number): number {
  const h = hashString(s + String(seed));
  return ((h & 0x7fffffff) % 10000) / 10000;
}

/**
 * Compute the radius of a circle that fits `n` items with
 * at least `minSpacing` between adjacent items.
 *
 * circumference = n * minSpacing  →  r = n * minSpacing / (2π)
 * Returns at least `minRadius`.
 */
function circleRadiusForCount(
  n: number,
  minSpacing: number,
  minRadius: number,
): number {
  if (n <= 1) return minRadius;
  return Math.max(minRadius, (n * minSpacing) / (2 * Math.PI));
}

// ── Main layout function ────────────────────────────────────

/**
 * Compute deterministic positions for all nodes from a GraphData payload.
 *
 * Handles any number of constellations and nodes:
 * - 1 constellation → centered at origin
 * - 2-6 → evenly spaced circle
 * - 7+ → circle with radius scaled to count
 *
 * All positions are in world-space units (arbitrary, consumed by Three.js).
 */
export function computeLayout(data: GraphData): SceneLayout {
  const { nodes, links } = data;

  // Build lookup structures
  const nodeById = new Map<string, GraphNode>();
  for (const n of nodes) nodeById.set(n.id, n);

  const childrenOf = new Map<string, string[]>();
  for (const link of links) {
    const src = typeof link.source === "string" ? link.source : link.source;
    const tgt = typeof link.target === "string" ? link.target : link.target;
    const list = childrenOf.get(src) ?? [];
    list.push(tgt);
    childrenOf.set(src, list);
  }

  const roots = nodes.filter((n) => n.type === "root");

  if (roots.length === 0) {
    return { constellations: [], totalRadius: 0 };
  }

  // Estimate per-constellation radius to calculate spacing
  const constellationSizes = roots.map((root) => {
    const subIds = childrenOf.get(root.id) ?? [];
    let maxTopics = 0;
    for (const sid of subIds) {
      const topicIds = childrenOf.get(sid) ?? [];
      maxTopics = Math.max(maxTopics, topicIds.length);
    }
    const subRingR = subRingRadius(subIds.length);
    return subRingR + TOPIC_SCATTER_MAX + 30;
  });

  const avgSize =
    constellationSizes.reduce((a, b) => a + b, 0) / constellationSizes.length;
  const spacing = Math.max(MIN_CONSTELLATION_SPACING, avgSize * 2.2);

  // Place root constellation centers
  const centers = placeConstellationCenters(roots.length, spacing);
  let totalRadius = 0;

  const constellations: ConstellationLayout[] = roots.map((root, i) => {
    const center = centers[i];
    const layout = layoutConstellation(
      root,
      center,
      nodeById,
      childrenOf,
    );
    totalRadius = Math.max(
      totalRadius,
      Math.hypot(center.x, center.y) + layout.radius,
    );
    return layout;
  });

  return { constellations, totalRadius };
}

// ── Constellation center placement ──────────────────────────

function placeConstellationCenters(count: number, spacing: number): Vec2[] {
  if (count === 1) return [{ x: 0, y: 0 }];

  const radius = circleRadiusForCount(count, spacing, spacing * 0.6);

  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  });
}

// ── Single constellation layout ─────────────────────────────

function subRingRadius(subCount: number): number {
  if (subCount <= 1) return 0;
  return SUB_RING_BASE + subCount * 12;
}

function layoutConstellation(
  root: GraphNode,
  center: Vec2,
  nodeById: Map<string, GraphNode>,
  childrenOf: Map<string, string[]>,
): ConstellationLayout {
  const subIds = childrenOf.get(root.id) ?? [];
  const subNodes = subIds
    .map((id) => nodeById.get(id))
    .filter((n): n is GraphNode => n != null);

  const subCount = subNodes.length;
  const ringR = subRingRadius(subCount);

  const subcategories: PositionedNode[] = [];
  const topics: PositionedNode[] = [];
  const allLinks: PositionedLink[] = [];
  let maxExtent = ringR + 30;

  // Place subcategories in a ring
  subNodes.forEach((sub, si) => {
    const angle =
      subCount === 1
        ? 0
        : (si / subCount) * Math.PI * 2 + hashNorm(sub.name, 0) * 0.3;
    const local: Vec2 = {
      x: Math.cos(angle) * ringR,
      y: Math.sin(angle) * ringR,
    };
    const world: Vec2 = {
      x: center.x + local.x,
      y: center.y + local.y,
    };

    subcategories.push({ node: sub, local, world });

    // Place topics scattered around this subcategory
    const topicIds = childrenOf.get(sub.id) ?? [];
    const topicNodes = topicIds
      .map((id) => nodeById.get(id))
      .filter((n): n is GraphNode => n != null);

    topicNodes.forEach((topic) => {
      const tAngle = hashNorm(topic.name, 1) * Math.PI * 2;
      const tDist =
        TOPIC_SCATTER_MIN +
        hashNorm(topic.name, 2) * (TOPIC_SCATTER_MAX - TOPIC_SCATTER_MIN);
      const tLocal: Vec2 = {
        x: local.x + Math.cos(tAngle) * tDist,
        y: local.y + Math.sin(tAngle) * tDist,
      };
      const tWorld: Vec2 = {
        x: center.x + tLocal.x,
        y: center.y + tLocal.y,
      };

      topics.push({ node: topic, local: tLocal, world: tWorld });

      // Link: subcategory → topic
      allLinks.push({ from: world, to: tWorld, kind: "content" });

      // Track bounding extent
      const extent = Math.hypot(tLocal.x, tLocal.y);
      if (extent > maxExtent) maxExtent = extent;
    });
  });

  // Structural links between adjacent subcategories (constellation outline)
  if (subcategories.length > 1) {
    for (let i = 0; i < subcategories.length; i++) {
      const j = (i + 1) % subcategories.length;
      allLinks.push({
        from: subcategories[i].world,
        to: subcategories[j].world,
        kind: "structural",
      });
    }
  }

  return {
    rootId: root.id,
    rootName: root.name,
    center,
    subcategories,
    topics,
    links: allLinks,
    radius: maxExtent + 20,
  };
}
