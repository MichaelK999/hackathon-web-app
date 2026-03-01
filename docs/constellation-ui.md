# Constellation UI

## Overview

The dashboard renders a knowledge graph as an interactive constellation map. Each **root category** from the pipeline output becomes a constellation, with **subcategories** as bright stars and **topics** as smaller stars scattered around them. Connection lines form the constellation patterns.

Built with Three.js (OrthographicCamera, UnrealBloomPass) wrapped in a React component.

## Architecture

```
src/
├── lib/constellation/
│   ├── types.ts                  # All interfaces, palette, config defaults
│   ├── layout.ts                 # Pure layout algorithm (no Three.js dependency)
│   ├── ConstellationRenderer.ts  # Three.js scene class with full lifecycle
│   └── index.ts                  # Barrel export
├── components/dashboard/
│   └── GraphVisualization.tsx    # React wrapper (thin, ~250 lines)
└── app/(dashboard)/dashboard/
    └── page.tsx                  # Dashboard page with sidebar + graph
```

### Separation of concerns

- **layout.ts** — Pure functions. Takes `GraphData`, returns `SceneLayout` with world-space positions. No rendering code. Testable in isolation.
- **ConstellationRenderer.ts** — Owns the Three.js scene, camera, bloom, animation loop, and all input handling. Framework-agnostic (no React). Exposes `updateData()`, `focusConstellation()`, `unfocus()`, `dispose()`.
- **GraphVisualization.tsx** — Thin React bridge. Manages tooltip state, topic detail panel, and Escape key hierarchy. Dynamic-imports the renderer to avoid SSR issues.

## Visual Design

### Astral Sorcery inspiration

The visual system is based on [Astral Sorcery](https://github.com/HellFirePvP/AstralSorcery), a Minecraft mod. Key elements replicated:

- Stars on a grid with connections drawn as lines between them
- Flickering via `sin(time * speed + phase)` per star (AS uses `stdFlicker` / `conCFlicker`)
- Additive blending on all emissive elements (stars, lines)
- Blue-tinted deep space background with particle star field
- No physics simulation — positions computed deterministically from hierarchy

### Color palette

| Element          | Hex       | Usage                              |
|------------------|-----------|------------------------------------|
| Background       | `#050a18` | Scene clear color                  |
| Root label       | `#e8f0fe` | Constellation title text           |
| Subcategory star | `#a0c4ff` | Medium blue-white stars            |
| Topic star       | `#ffd699` | Small warm gold stars              |
| Connection line  | `#4a6fa5` | Lines between stars                |
| Background stars | `#8899bb` | Ambient twinkling particle field   |

### Bloom

UnrealBloomPass with strength 1.4, radius 0.8, threshold 0.25. All star sprites and lines use `AdditiveBlending`, so they bloom naturally.

### Twinkling

- **Background stars**: Per-particle shader with `sin(uTime * aSpeed + aPhase)` controlling opacity (0.3–1.0 range). 400 particles spread across the viewport.
- **Constellation stars**: Scale pulse `1.0 + 0.08 * sin(time * 2.0 + phase)` on each sprite. Random phase per star for variety.

## Layout Algorithm

Positions are computed in `layout.ts` — no physics engine, fully deterministic.

### Constellation placement

Roots are distributed evenly on a circle. Radius scales with count:

```
radius = max(minRadius, count * minSpacing / 2π)
```

Single constellation centers at origin. This handles 1 to hundreds without overlap.

### Star placement within a constellation

1. **Subcategories** placed in a ring around the constellation center. Ring radius: `100 + subCount * 12`.
2. **Topics** scattered around their parent subcategory at distance 40–75px. Angle and distance derived from `hashString(topic.name)` for stability (same data = same layout).
3. **Structural lines** connect adjacent subcategories in a ring (constellation outline).
4. **Content lines** connect each subcategory to its child topics.

## Navigation

### Three zoom levels

```
Overview  ←→  Constellation focus  ←→  Topic detail panel
   Esc             Esc                      Esc
```

| Level                  | What's visible                                              | How to enter                          | How to exit                |
|------------------------|-------------------------------------------------------------|---------------------------------------|----------------------------|
| Overview               | All constellations, root labels, stars as dots              | Default state / Escape from focus     | —                          |
| Constellation focus    | One constellation enlarged, labels on all stars, others dim | Click root label or subcategory star  | Escape, back button, or scroll out |
| Topic detail panel     | Slide-in panel with segments, keywords, breadcrumb          | Click a topic star                    | Escape, back arrow button  |

### Camera animation

Focus transitions use eased camera pan + zoom over 800ms (`easeInOutCubic`). The `targetZoom` is interpolated at 15% per frame for smooth trackpad zooming.

### Auto-unfocus

If the user scrolls/pinches out past zoom level 1.2 while focused, the constellation auto-unfocuses back to overview.

## Input Handling

Designed for trackpad (Linux/Firefox tested), mouse, and touch.

| Gesture                          | Action                       |
|----------------------------------|------------------------------|
| Left-click drag                  | Pan (4px dead zone for clicks) |
| Two-finger scroll (trackpad)     | Pan (detected via `deltaX !== 0`) |
| Pinch / Ctrl+scroll              | Smooth zoom                  |
| Mouse wheel                      | Smooth zoom                  |
| Touch single-finger drag         | Pan                          |
| Touch two-finger pinch           | Zoom + pan                   |
| Double-tap-hold-drag (Linux)     | Pan (handled via pointer events + capture) |
| Click root label                 | Focus / unfocus constellation |
| Click subcategory star           | Focus parent constellation   |
| Click topic star                 | Open topic detail panel      |
| Escape                           | Go back one level            |
| Right-click                      | Suppressed (context menu)    |

### Trackpad detection

Rather than fragile browser-sniffing, the wheel handler uses:
- `e.ctrlKey === true` → pinch gesture (all browsers)
- `e.deltaMode === 1` → discrete mouse wheel (line units)
- `e.deltaX !== 0` with pixel mode → trackpad two-finger scroll

### Pointer capture

`setPointerCapture` is used on pointer down so drag events continue even when the cursor leaves the canvas. This makes the double-tap-hold gesture on Linux trackpads work reliably.

## Data Flow

```
Backend API                    React hooks              Renderer
─────────────                  ───────────              ────────
GET /api/graph-data      →     useGraphData        →    updateData(GraphData)
SSE /api/pipeline/stream →     usePipelineSSE      →    processEvent → updateData
GET /api/topic/{label}   →     fetchTopicDetail    →    topic detail panel state
```

- `useGraphData` handles progressive node addition during the labeling phase and full graph snapshot replacement after hierarchy is built.
- `updateData()` on the renderer clears old constellations and rebuilds from scratch. Proper Three.js disposal (materials, geometries).
- Topic detail is fetched on demand when a topic star is clicked.

## Configuration

All visual constants are in `types.ts`:

```typescript
const DEFAULT_CONFIG: RendererConfig = {
  background: 0x050a18,
  backgroundStarCount: 400,
  bloom: { strength: 1.4, radius: 0.8, threshold: 0.25 },
  zoomDuration: 800,      // ms for focus animation
  focusZoom: 3.0,          // zoom level when focused
  unfocusZoomThreshold: 1.2, // auto-unfocus below this
};
```

These can be overridden by passing a partial config to the `ConstellationRenderer` constructor.
