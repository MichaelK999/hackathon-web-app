"use client";

import { useCallback, useEffect, useRef } from "react";
import type { SkillNode, SkillTree } from "@/lib/types";

// ---------- Layout types ----------

interface LayoutNode {
	x: number;
	y: number;
	r: number;
	label: string;
	keywords: string[];
	segmentCount: number;
	status: "locked" | "unlocked";
	type: "hub" | "root" | "subcategory" | "topic";
	color: string;
	rootGroup: string;
	parentLabel?: string;
	breadcrumb?: string;
}

interface LayoutLink {
	from: LayoutNode;
	to: LayoutNode;
	color: string;
}

// ---------- Constants ----------

const GROUP_COLORS = [
	"#8b5cf6", // violet
	"#06b6d4", // cyan
	"#f59e0b", // amber
	"#f43f5e", // rose
	"#10b981", // emerald
	"#3b82f6", // blue
	"#ec4899", // pink
	"#14b8a6", // teal
];

const BG_COLOR = "#08051a";
const STAR_COUNT = 300;

// ---------- Helpers ----------

function hashString(s: string): number {
	let h = 0;
	for (let i = 0; i < s.length; i++) {
		h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
	}
	return Math.abs(h);
}

function hexToRgba(hex: string, alpha: number): string {
	const r = parseInt(hex.slice(1, 3), 16);
	const g = parseInt(hex.slice(3, 5), 16);
	const b = parseInt(hex.slice(5, 7), 16);
	return `rgba(${r},${g},${b},${alpha})`;
}

// ---------- Layout ----------

function buildLayout(tree: SkillTree["tree"]): {
	nodes: LayoutNode[];
	links: LayoutLink[];
} {
	const nodes: LayoutNode[] = [];
	const links: LayoutLink[] = [];

	const hub: LayoutNode = {
		x: 0,
		y: 0,
		r: 24,
		label: "Knowledge Hub",
		keywords: [],
		segmentCount: 0,
		status: "unlocked",
		type: "hub",
		color: "#ffffff",
		rootGroup: "",
	};
	nodes.push(hub);

	const rootNames = Object.keys(tree);
	const rootCount = rootNames.length;

	rootNames.forEach((rootName, ri) => {
		const angle = (2 * Math.PI * ri) / Math.max(rootCount, 1) - Math.PI / 2;
		const rootDist = 220 + rootCount * 15;
		const groupColor = GROUP_COLORS[ri % GROUP_COLORS.length];

		const rootNode: LayoutNode = {
			x: Math.cos(angle) * rootDist,
			y: Math.sin(angle) * rootDist,
			r: 20,
			label: rootName,
			keywords: [],
			segmentCount: 0,
			status: "unlocked",
			type: "root",
			color: groupColor,
			rootGroup: rootName,
		};
		nodes.push(rootNode);
		links.push({ from: hub, to: rootNode, color: groupColor });

		const subcats = tree[rootName];
		const subNames = Object.keys(subcats);

		subNames.forEach((subName, si) => {
			const subAngle =
				angle +
				((si - (subNames.length - 1) / 2) * 0.6) / Math.max(subNames.length, 1);
			const subDist = 130 + subNames.length * 10;

			const subNode: LayoutNode = {
				x: rootNode.x + Math.cos(subAngle) * subDist,
				y: rootNode.y + Math.sin(subAngle) * subDist,
				r: 12,
				label: subName,
				keywords: [],
				segmentCount: 0,
				status: "unlocked",
				type: "subcategory",
				color: groupColor,
				rootGroup: rootName,
			};
			nodes.push(subNode);
			links.push({ from: rootNode, to: subNode, color: groupColor });

			const topics: SkillNode[] = subcats[subName];

			topics.forEach((topic, ti) => {
				const topicAngle =
					subAngle +
					((ti - (topics.length - 1) / 2) * 0.45) /
						Math.max(topics.length, 1);
				const h = hashString(topic.label);
				const topicDist = 60 + (h % 40);

				const topicNode: LayoutNode = {
					x: subNode.x + Math.cos(topicAngle) * topicDist,
					y: subNode.y + Math.sin(topicAngle) * topicDist,
					r: 6,
					label: topic.label,
					keywords: topic.keywords,
					segmentCount: topic.segment_count,
					status: topic.status,
					type: "topic",
					color: groupColor,
					rootGroup: rootName,
					parentLabel: subName,
					breadcrumb: `${rootName} / ${subName}`,
				};
				nodes.push(topicNode);
				links.push({ from: subNode, to: topicNode, color: groupColor });
			});
		});
	});

	return { nodes, links };
}

// ---------- Star field ----------

interface Star {
	x: number;
	y: number;
	size: number;
	brightness: number;
	phase: number;
}

function generateStars(width: number, height: number): Star[] {
	const stars: Star[] = [];
	for (let i = 0; i < STAR_COUNT; i++) {
		stars.push({
			x: Math.random() * width,
			y: Math.random() * height,
			size: Math.random() * 1.5 + 0.5,
			brightness: Math.random() * 0.6 + 0.2,
			phase: Math.random() * Math.PI * 2,
		});
	}
	return stars;
}

// ---------- Component ----------

interface SkillTreeCanvasProps {
	data: SkillTree;
	onTopicClick?: (node: LayoutNode) => void;
}

export type { LayoutNode };

export function SkillTreeCanvas({ data, onTopicClick }: SkillTreeCanvasProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const stateRef = useRef({
		offsetX: 0,
		offsetY: 0,
		zoom: 1,
		isDragging: false,
		dragStartX: 0,
		dragStartY: 0,
		dragStartOffsetX: 0,
		dragStartOffsetY: 0,
		hasMoved: false,
		hoveredNode: null as LayoutNode | null,
		animFrame: 0,
		stars: [] as Star[],
		nodes: [] as LayoutNode[],
		links: [] as LayoutLink[],
	});

	// Recalculate layout when data changes
	useEffect(() => {
		const { nodes, links } = buildLayout(data.tree);
		stateRef.current.nodes = nodes;
		stateRef.current.links = links;
	}, [data]);

	// Canvas drawing
	const draw = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const s = stateRef.current;
		const w = canvas.width;
		const h = canvas.height;
		const t = performance.now() / 1000;

		// Clear
		ctx.fillStyle = BG_COLOR;
		ctx.fillRect(0, 0, w, h);

		// Draw stars (screen space, not affected by pan/zoom)
		for (const star of s.stars) {
			const twinkle =
				star.brightness * (0.7 + 0.3 * Math.sin(t * 1.5 + star.phase));
			ctx.fillStyle = `rgba(200,200,255,${twinkle})`;
			ctx.beginPath();
			ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
			ctx.fill();
		}

		// Transform to world space
		ctx.save();
		ctx.translate(w / 2 + s.offsetX, h / 2 + s.offsetY);
		ctx.scale(s.zoom, s.zoom);

		// Draw links
		for (const link of s.links) {
			const alpha = 0.15;
			ctx.strokeStyle = hexToRgba(link.color, alpha);
			ctx.lineWidth = 1 / s.zoom;
			ctx.beginPath();
			ctx.moveTo(link.from.x, link.from.y);
			ctx.lineTo(link.to.x, link.to.y);
			ctx.stroke();
		}

		// Draw nodes
		for (const node of s.nodes) {
			const isHovered = s.hoveredNode === node;

			let opacity: number;
			let glowRadius: number;

			if (node.type === "hub" || node.type === "root" || node.type === "subcategory") {
				opacity = 0.85;
				glowRadius = 8;
			} else if (node.status === "unlocked") {
				opacity = 1.0;
				glowRadius = 14;
			} else {
				opacity = 0.3;
				glowRadius = 0;
			}

			if (isHovered) {
				opacity = Math.min(opacity + 0.3, 1.0);
				glowRadius += 6;
			}

			// Glow
			if (glowRadius > 0) {
				ctx.shadowBlur = glowRadius;
				ctx.shadowColor = hexToRgba(node.color, 0.6);
			} else {
				ctx.shadowBlur = 0;
			}

			// Radial gradient fill
			const grad = ctx.createRadialGradient(
				node.x,
				node.y,
				0,
				node.x,
				node.y,
				node.r,
			);
			grad.addColorStop(0, hexToRgba(node.color, opacity));
			grad.addColorStop(1, hexToRgba(node.color, opacity * 0.2));

			ctx.fillStyle = grad;
			ctx.beginPath();
			ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
			ctx.fill();

			ctx.shadowBlur = 0;

			// Label for root, subcategory, and hub nodes
			if (
				node.type === "hub" ||
				node.type === "root" ||
				(node.type === "subcategory" && s.zoom > 0.6)
			) {
				const fontSize =
					node.type === "hub"
						? 12
						: node.type === "root"
							? 10
							: 8;
				ctx.font = `${fontSize / s.zoom < 6 ? 6 : fontSize}px sans-serif`;
				ctx.fillStyle = hexToRgba("#e8f0fe", opacity * 0.9);
				ctx.textAlign = "center";
				ctx.textBaseline = "top";
				ctx.fillText(node.label, node.x, node.y + node.r + 4);
			}

			// Label for topic nodes when zoomed in enough
			if (node.type === "topic" && s.zoom > 1.2) {
				ctx.font = "6px sans-serif";
				ctx.fillStyle = hexToRgba("#e8f0fe", opacity * 0.7);
				ctx.textAlign = "center";
				ctx.textBaseline = "top";
				const displayLabel =
					node.label.length > 20
						? node.label.slice(0, 18) + "..."
						: node.label;
				ctx.fillText(displayLabel, node.x, node.y + node.r + 3);
			}
		}

		ctx.restore();

		s.animFrame = requestAnimationFrame(draw);
	}, []);

	// Initialize canvas, stars, and animation loop
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const resize = () => {
			const rect = canvas.parentElement?.getBoundingClientRect();
			if (!rect) return;
			const dpr = window.devicePixelRatio || 1;
			canvas.width = rect.width * dpr;
			canvas.height = rect.height * dpr;
			canvas.style.width = `${rect.width}px`;
			canvas.style.height = `${rect.height}px`;
			const ctx = canvas.getContext("2d");
			if (ctx) ctx.scale(dpr, dpr);
			// Use CSS dimensions for stars
			stateRef.current.stars = generateStars(rect.width, rect.height);
		};

		resize();
		window.addEventListener("resize", resize);

		stateRef.current.animFrame = requestAnimationFrame(draw);

		return () => {
			window.removeEventListener("resize", resize);
			cancelAnimationFrame(stateRef.current.animFrame);
		};
	}, [draw]);

	// Hit test: find node under screen point
	const hitTest = useCallback(
		(screenX: number, screenY: number): LayoutNode | null => {
			const canvas = canvasRef.current;
			if (!canvas) return null;
			const rect = canvas.getBoundingClientRect();
			const s = stateRef.current;
			const cssW = rect.width;
			const cssH = rect.height;

			// Convert screen → world
			const worldX = (screenX - rect.left - cssW / 2 - s.offsetX) / s.zoom;
			const worldY = (screenY - rect.top - cssH / 2 - s.offsetY) / s.zoom;

			// Check nodes in reverse (topmost first)
			for (let i = s.nodes.length - 1; i >= 0; i--) {
				const n = s.nodes[i];
				const dx = worldX - n.x;
				const dy = worldY - n.y;
				const hitR = Math.max(n.r, 10); // minimum hit radius for small nodes
				if (dx * dx + dy * dy <= hitR * hitR) {
					return n;
				}
			}
			return null;
		},
		[],
	);

	// Mouse handlers
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const onMouseDown = (e: MouseEvent) => {
			const s = stateRef.current;
			s.isDragging = true;
			s.hasMoved = false;
			s.dragStartX = e.clientX;
			s.dragStartY = e.clientY;
			s.dragStartOffsetX = s.offsetX;
			s.dragStartOffsetY = s.offsetY;
		};

		const onMouseMove = (e: MouseEvent) => {
			const s = stateRef.current;
			if (s.isDragging) {
				const dx = e.clientX - s.dragStartX;
				const dy = e.clientY - s.dragStartY;
				if (Math.abs(dx) > 4 || Math.abs(dy) > 4) s.hasMoved = true;
				s.offsetX = s.dragStartOffsetX + dx;
				s.offsetY = s.dragStartOffsetY + dy;
			}
			// Hover detection
			const node = hitTest(e.clientX, e.clientY);
			s.hoveredNode = node;
			canvas.style.cursor = node && node.type === "topic" ? "pointer" : "grab";
		};

		const onMouseUp = (e: MouseEvent) => {
			const s = stateRef.current;
			if (!s.hasMoved) {
				const node = hitTest(e.clientX, e.clientY);
				if (node && node.type === "topic" && onTopicClick) {
					onTopicClick(node);
				}
			}
			s.isDragging = false;
		};

		const onWheel = (e: WheelEvent) => {
			e.preventDefault();
			const s = stateRef.current;
			const factor = e.deltaY > 0 ? 0.92 : 1.08;
			const newZoom = Math.max(0.15, Math.min(20, s.zoom * factor));

			// Zoom toward mouse position: keep the world point under the
			// cursor fixed by adjusting the pan offset.
			const rect = canvas.getBoundingClientRect();
			const pixelRatio = window.devicePixelRatio || 1;
			const mx = (e.clientX - rect.left) * pixelRatio - canvas.width / 2 - s.offsetX;
			const my = (e.clientY - rect.top) * pixelRatio - canvas.height / 2 - s.offsetY;
			const scale = 1 - newZoom / s.zoom;
			s.offsetX += mx * scale;
			s.offsetY += my * scale;

			s.zoom = newZoom;
		};

		canvas.addEventListener("mousedown", onMouseDown);
		canvas.addEventListener("mousemove", onMouseMove);
		canvas.addEventListener("mouseup", onMouseUp);
		canvas.addEventListener("mouseleave", () => {
			stateRef.current.isDragging = false;
			stateRef.current.hoveredNode = null;
		});
		canvas.addEventListener("wheel", onWheel, { passive: false });

		return () => {
			canvas.removeEventListener("mousedown", onMouseDown);
			canvas.removeEventListener("mousemove", onMouseMove);
			canvas.removeEventListener("mouseup", onMouseUp);
			canvas.removeEventListener("wheel", onWheel);
		};
	}, [hitTest, onTopicClick]);

	// Tooltip state
	const tooltipRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const updateTooltip = (e: MouseEvent) => {
			const tooltip = tooltipRef.current;
			if (!tooltip) return;
			const node = stateRef.current.hoveredNode;
			if (node && node.type !== "hub") {
				tooltip.style.display = "block";
				tooltip.style.left = `${e.clientX + 15}px`;
				tooltip.style.top = `${e.clientY + 15}px`;
				tooltip.innerHTML = `
					<div style="font-weight:600;color:#e8f0fe;margin-bottom:2px">${node.label}</div>
					<div style="font-size:0.7rem;color:#5a7a9a;text-transform:uppercase">${node.type} · ${node.status}${node.type === "topic" ? ` · ${node.segmentCount} segment${node.segmentCount !== 1 ? "s" : ""}` : ""}</div>
					${node.keywords.length > 0 ? `<div style="margin-top:4px;display:flex;flex-wrap:wrap;gap:4px">${node.keywords.map((k) => `<span style="background:rgba(74,111,165,0.15);padding:2px 6px;border-radius:4px;font-size:0.7rem;color:#7eb4e2">${k}</span>`).join("")}</div>` : ""}
				`;
			} else {
				tooltip.style.display = "none";
			}
		};

		canvas.addEventListener("mousemove", updateTooltip);
		return () => canvas.removeEventListener("mousemove", updateTooltip);
	}, []);

	return (
		<div className="relative h-full w-full">
			<canvas ref={canvasRef} className="h-full w-full" />
			<div
				ref={tooltipRef}
				className="pointer-events-none fixed z-30 hidden max-w-[300px] rounded-lg border border-[#4a6fa5]/35 bg-[#0a1024]/92 px-3 py-2 backdrop-blur-md"
			/>
			<div className="absolute bottom-3 left-3 z-10 rounded-lg border border-[#4a6fa5]/20 bg-[#0a1024]/85 px-3 py-1.5 text-[0.75rem] text-[#5a7a9a] backdrop-blur-sm">
				scroll to zoom · drag to pan · click topic to unlock
			</div>
		</div>
	);
}
