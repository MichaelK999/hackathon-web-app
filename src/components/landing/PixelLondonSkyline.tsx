"use client";

// Color palette matching Mistral hackathon aesthetic
const C = {
  O: "#f97316", // Mistral orange
  o: "#ea580c", // Dark orange
  R: "#ef4444", // Red
  r: "#dc2626", // Dark red
  G: "#fbbf24", // Gold
  g: "#d97706", // Dark gold
  S: "#9ca3af", // Stone gray
  s: "#6b7280", // Dark stone
  D: "#374151", // Dark gray
  d: "#1f2937", // Very dark
  W: "#f3f4f6", // White
  w: "#d1d5db", // Light gray
  L: "#60a5fa", // Light blue
  l: "#3b82f6", // Blue
  T: "#a8a29e", // Tan
  t: "#78716c", // Dark tan
  K: "#111827", // Near black
  P: "#7c3aed", // Purple accent
};

type ColorKey = keyof typeof C;

// Each landmark is defined as a string grid where each char maps to a color
function parseGrid(grid: string): (string | null)[][] {
  return grid
    .trim()
    .split("\n")
    .map((row) =>
      [...row].map((ch) => {
        if (ch === "." || ch === " ") return null;
        return C[ch as ColorKey] ?? null;
      })
    );
}

function PixelGrid({
  grid,
  pixelSize,
  x,
  y,
}: {
  grid: (string | null)[][];
  pixelSize: number;
  x: number;
  y: number;
}) {
  return (
    <g>
      {grid.flatMap((row, ry) =>
        row.map((color, rx) =>
          color ? (
            <rect
              key={`${rx}-${ry}`}
              x={x + rx * pixelSize}
              y={y + ry * pixelSize}
              width={pixelSize}
              height={pixelSize}
              fill={color}
            />
          ) : null
        )
      )}
    </g>
  );
}

// ─── LANDMARK DEFINITIONS ───

const BIG_BEN = parseGrid(`
......O.......
......O.......
.....OOO......
.....OgO......
....OgWWgO....
....OgWWgO....
....OgggggO...
.....SSSS.....
.....SWWS.....
.....SSSS.....
.....SWWS.....
.....SSSS.....
.....SWWS.....
.....SSSS.....
....SSSSSS....
....SsDDsS....
...SSSSSSSS...
...SsWSSWsS...
..SSSSSSSSSS..
..SSSSSSSSSS..
..DDDDDDDDDD..
`);

const TOWER_BRIDGE = parseGrid(`
..........SS..........SS..........
..........SS..........SS..........
..........SS..........SS..........
.........SSSS........SSSS.........
.........SSSS........SSSS.........
.......SSSSSS......SSSSSS........
.......SWWWSS......SWWWSS........
.......SSSSSSLLLLLLSSSSSS........
.......SSSSSSLLLLLLSSSSSS........
.......SWWWSS......SWWWSS........
.......SSSSSS......SSSSSS........
.......SSSSSS......SSSSSS........
......SSSSSSSS....SSSSSSSS.......
DDDDDDSSSSSSSSDDDDSSSSSSSSDDDDDDD
DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD
LLLLLLLLLLLLLLllLLLLLLLLLLLLLLLLL
`);

const LONDON_EYE = parseGrid(`
.......SSSS.......
.....SS....SS.....
....S........S....
...S..........S...
..S............S..
..S............S..
.S..............S.
.S..............S.
.S..............S.
..S............S..
..S............S..
...S..........S...
....S........S....
.....SS....SS.....
.......SSSS.......
........SS........
........SS........
.......SSSS.......
......SSSSSS......
`);

const PHONE_BOX = parseGrid(`
..RRRRRR..
..RRRRRR..
..RWWWWR..
..RWWWWR..
..RRRRRR..
..RWWWWR..
..RWWWWR..
..RWWWWR..
..RRRRRR..
..RRRRRR..
..DDDDDD..
`);

const TEN_DOWNING = parseGrid(`
...DDDDDDDDDD...
...DSSSSSSSSSD...
...DSWWWWWWWSD...
...DSWWWWWWWSD...
...DSSSSSSSSSD...
...DSWWSDSWWSD...
...DSWWSDSWWSD...
...DSSSSDSSSSD...
...DSWWSDSWWSD...
...DSWWSDSWWSD...
...DSSSSDSSSSD...
...DSSDDDDSSSD...
...DSSDSSWSSSD...
...DSSDSSWSSSD...
...DSSDDDDSSSD...
...DDDDDDDDDD...
`);

// Generic building blocks
const BUILDING_TALL = parseGrid(`
DDDDDDDD
DDWDDDWD
DDDDDDDD
DDWDDDWD
DDDDDDDD
DDWDDDWD
DDDDDDDD
DDWDDDWD
DDDDDDDD
DDWDDDWD
DDDDDDDD
DDDDDDDD
`);

const BUILDING_SHORT = parseGrid(`
DDDDDDD
DDWDDWD
DDDDDDD
DDWDDWD
DDDDDDD
DDWDDWD
DDDDDDD
DDDDDDD
`);

const BUILDING_MED = parseGrid(`
DDDDDDDDD
DDWDDWDDD
DDDDDDDDD
DDWDDWDDD
DDDDDDDDD
DDWDDWDDD
DDDDDDDDD
DDWDDWDDD
DDDDDDDDD
DDDDDDDDD
`);

// Stars data
const stars = [
  { x: 30, y: 15, r: 2 },
  { x: 95, y: 8, r: 1.5 },
  { x: 160, y: 22, r: 2 },
  { x: 230, y: 12, r: 1 },
  { x: 310, y: 18, r: 2 },
  { x: 380, y: 7, r: 1.5 },
  { x: 450, y: 25, r: 1 },
  { x: 520, y: 10, r: 2 },
  { x: 580, y: 20, r: 1.5 },
  { x: 650, y: 14, r: 1 },
  { x: 720, y: 8, r: 2 },
  { x: 790, y: 22, r: 1.5 },
  { x: 55, y: 35, r: 1 },
  { x: 140, y: 40, r: 1.5 },
  { x: 270, y: 30, r: 1 },
  { x: 420, y: 38, r: 1 },
  { x: 560, y: 42, r: 1.5 },
  { x: 680, y: 35, r: 1 },
  { x: 750, y: 45, r: 1 },
];

export function PixelLondonSkyline() {
  const ps = 4; // pixel size
  const groundY = 260;
  const skylineWidth = 840;
  const totalHeight = 300;

  return (
    <div className="w-full overflow-hidden">
      <svg
        viewBox={`0 0 ${skylineWidth} ${totalHeight}`}
        className="w-full h-auto"
        style={{ maxHeight: "340px" }}
      >
        {/* Stars */}
        {stars.map((star, i) => (
          <circle
            key={i}
            cx={star.x}
            cy={star.y}
            r={star.r}
            fill="#f97316"
            className="star"
            style={
              {
                "--delay": `${i * 0.4}s`,
                "--duration": `${2 + (i % 3)}s`,
              } as React.CSSProperties
            }
            opacity={0.6}
          />
        ))}

        {/* Small dots (like Mistral hackathon map dots) */}
        {Array.from({ length: 40 }).map((_, i) => (
          <rect
            key={`dot-${i}`}
            x={((i * 73 + 17) % skylineWidth)}
            y={50 + ((i * 37) % 60)}
            width={2}
            height={2}
            fill="#374151"
            opacity={0.5}
          />
        ))}

        {/* Phone box (far left) */}
        <PixelGrid grid={PHONE_BOX} pixelSize={ps} x={20} y={groundY - 11 * ps} />

        {/* Short building */}
        <PixelGrid grid={BUILDING_SHORT} pixelSize={ps} x={68} y={groundY - 8 * ps} />

        {/* 10 Downing Street */}
        <PixelGrid grid={TEN_DOWNING} pixelSize={ps} x={108} y={groundY - 16 * ps} />

        {/* Medium building */}
        <PixelGrid grid={BUILDING_MED} pixelSize={ps} x={180} y={groundY - 10 * ps} />

        {/* Tall building */}
        <PixelGrid grid={BUILDING_TALL} pixelSize={ps} x={228} y={groundY - 12 * ps} />

        {/* BIG BEN (centerpiece) */}
        <PixelGrid grid={BIG_BEN} pixelSize={ps} x={290} y={groundY - 21 * ps} />

        {/* Buildings between Big Ben and Tower Bridge */}
        <PixelGrid grid={BUILDING_SHORT} pixelSize={ps} x={360} y={groundY - 8 * ps} />
        <PixelGrid grid={BUILDING_MED} pixelSize={ps} x={400} y={groundY - 10 * ps} />

        {/* TOWER BRIDGE */}
        <PixelGrid grid={TOWER_BRIDGE} pixelSize={ps} x={460} y={groundY - 16 * ps} />

        {/* Buildings after bridge */}
        <PixelGrid grid={BUILDING_TALL} pixelSize={ps} x={610} y={groundY - 12 * ps} />
        <PixelGrid grid={BUILDING_SHORT} pixelSize={ps} x={650} y={groundY - 8 * ps} />

        {/* LONDON EYE */}
        <PixelGrid grid={LONDON_EYE} pixelSize={ps} x={700} y={groundY - 19 * ps} />

        {/* Short building (far right) */}
        <PixelGrid grid={BUILDING_MED} pixelSize={ps} x={780} y={groundY - 10 * ps} />

        {/* Ground line */}
        <rect x={0} y={groundY} width={skylineWidth} height={4} fill="#374151" />

        {/* Thames water (dotted blue line under bridge) */}
        {Array.from({ length: Math.floor(skylineWidth / 8) }).map((_, i) => (
          <rect
            key={`water-${i}`}
            x={i * 8}
            y={groundY + 6}
            width={5}
            height={2}
            fill="#1e40af"
            opacity={0.4}
          />
        ))}

        {/* Ground fill */}
        <rect x={0} y={groundY + 10} width={skylineWidth} height={30} fill="#111827" />
      </svg>
    </div>
  );
}
