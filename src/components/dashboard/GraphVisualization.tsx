"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchTopicDetail } from "@/lib/api";
import type { GraphData, GraphNode, TopicDetail } from "@/lib/types";

interface GraphVisualizationProps {
	data: GraphData;
}

// Lazy-imported renderer type (avoids pulling Three.js into SSR bundle)
type ConstellationRendererType = InstanceType<
	typeof import("@/lib/constellation").ConstellationRenderer
>;

export function GraphVisualization({ data }: GraphVisualizationProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const rendererRef = useRef<ConstellationRendererType | null>(null);
	const [isFocused, setIsFocused] = useState(false);
	const [tooltip, setTooltip] = useState<{
		node: GraphNode;
		x: number;
		y: number;
	} | null>(null);

	// Topic detail panel state
	const [selectedTopic, setSelectedTopic] = useState<TopicDetail | null>(null);
	const [topicLoading, setTopicLoading] = useState(false);

	// Track mouse position for tooltip placement
	const mousePos = useRef({ x: 0, y: 0 });
	const handleWindowMouseMove = useCallback((e: MouseEvent) => {
		mousePos.current = { x: e.clientX, y: e.clientY };
		setTooltip((prev) =>
			prev ? { ...prev, x: e.clientX + 15, y: e.clientY + 15 } : null,
		);
	}, []);

	// Open topic detail panel
	const openTopic = useCallback(async (node: GraphNode) => {
		setTopicLoading(true);
		setSelectedTopic(null);
		try {
			const detail = await fetchTopicDetail(node.name);
			setSelectedTopic(detail);
		} catch {
			setSelectedTopic({
				label: node.name,
				keywords: node.keywords ?? [],
				segments: [],
				root_cat: null,
				sub_cat: null,
			});
		} finally {
			setTopicLoading(false);
		}
	}, []);

	const closeTopic = useCallback(() => {
		setSelectedTopic(null);
		setTopicLoading(false);
	}, []);

	// Escape key hierarchy: topic panel → constellation → overview
	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key !== "Escape") return;

			if (selectedTopic || topicLoading) {
				// Level 1: close topic panel, stay on constellation
				closeTopic();
			} else if (rendererRef.current?.isFocused) {
				// Level 2: unfocus constellation → overview
				rendererRef.current.unfocus();
				setIsFocused(false);
			}
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [selectedTopic, topicLoading, closeTopic]);

	// Initialize renderer on mount (dynamic import for SSR safety)
	useEffect(() => {
		if (!containerRef.current) return;

		let disposed = false;
		let instance: ConstellationRendererType | null = null;

		async function init() {
			const { ConstellationRenderer } = await import("@/lib/constellation");
			if (disposed || !containerRef.current) return;

			instance = new ConstellationRenderer(containerRef.current, {
				onTopicClick: (node) => {
					openTopic(node);
				},
				onHover: (node) => {
					if (node) {
						setTooltip({
							node,
							x: mousePos.current.x + 15,
							y: mousePos.current.y + 15,
						});
					} else {
						setTooltip(null);
					}
				},
			});

			rendererRef.current = instance;

			// Sync focused state for UI
			const checkFocus = () => {
				if (instance) setIsFocused(instance.isFocused);
				if (!disposed) requestAnimationFrame(checkFocus);
			};
			checkFocus();
		}

		window.addEventListener("mousemove", handleWindowMouseMove);
		init();

		return () => {
			disposed = true;
			window.removeEventListener("mousemove", handleWindowMouseMove);
			if (instance) {
				instance.dispose();
				rendererRef.current = null;
			}
		};
	}, [handleWindowMouseMove, openTopic]);

	// Feed data updates to renderer
	useEffect(() => {
		if (rendererRef.current) {
			rendererRef.current.updateData(data);
		}
	}, [data]);

	const handleUnfocus = useCallback(() => {
		rendererRef.current?.unfocus();
		setIsFocused(false);
	}, []);

	const topicPanelOpen = selectedTopic !== null || topicLoading;

	return (
		<div className="relative h-full w-full">
			{/* Back button (visible when focused on constellation, hidden when topic panel is open) */}
			{isFocused && !topicPanelOpen && (
				<button
					type="button"
					onClick={handleUnfocus}
					className="absolute left-3 top-3 z-10 rounded-lg border border-[#4a6fa5]/30 bg-[#0a1024]/85 px-3 py-2 text-sm text-[#7eb4e2] backdrop-blur-sm transition-colors hover:border-[#4a6fa5]/70 hover:text-[#a0c4ff]"
				>
					&larr; All Constellations
				</button>
			)}

			{/* Tooltip (hidden when topic panel is open) */}
			{tooltip && !topicPanelOpen && (
				<div
					className="pointer-events-none fixed z-30 max-w-[300px] rounded-lg border border-[#4a6fa5]/35 bg-[#0a1024]/92 px-3 py-2 backdrop-blur-md"
					style={{ left: tooltip.x, top: tooltip.y }}
				>
					<div className="mb-0.5 font-semibold text-[#e8f0fe]">
						{tooltip.node.name}
					</div>
					<div className="text-[0.7rem] uppercase tracking-wide text-[#5a7a9a]">
						{tooltip.node.type} &middot; {tooltip.node.segment_count ?? 0}{" "}
						segment{(tooltip.node.segment_count ?? 0) !== 1 ? "s" : ""}
					</div>
					{tooltip.node.keywords && tooltip.node.keywords.length > 0 && (
						<div className="mt-1.5 flex flex-wrap gap-1">
							{tooltip.node.keywords.map((kw) => (
								<span
									key={kw}
									className="rounded bg-[#4a6fa5]/15 px-1.5 py-0.5 text-[0.7rem] text-[#7eb4e2]"
								>
									{kw}
								</span>
							))}
						</div>
					)}
				</div>
			)}

			{/* Three.js canvas container */}
			<div ref={containerRef} className="h-full w-full" />

			{/* Empty state */}
			{data.nodes.length === 0 && (
				<div className="absolute inset-0 flex items-center justify-center">
					<p className="text-sm text-[#5a7a9a]">
						Start the pipeline to see your constellation map
					</p>
				</div>
			)}

			{/* Topic detail panel (slide-in from right) */}
			{topicPanelOpen && (
				<div className="absolute inset-y-0 right-0 z-20 flex w-full max-w-lg flex-col border-l border-[#4a6fa5]/20 bg-[#080e1e]/95 backdrop-blur-lg">
					{/* Header with back button */}
					<div className="flex items-center gap-3 border-b border-[#4a6fa5]/15 px-4 py-3">
						<button
							type="button"
							onClick={closeTopic}
							className="flex h-8 w-8 items-center justify-center rounded-md border border-[#4a6fa5]/30 text-[#7eb4e2] transition-colors hover:border-[#4a6fa5]/60 hover:text-[#a0c4ff]"
							title="Back (Esc)"
						>
							&larr;
						</button>
						<div className="min-w-0 flex-1">
							{topicLoading ? (
								<div className="h-5 w-48 animate-pulse rounded bg-[#4a6fa5]/20" />
							) : (
								<>
									<h2 className="truncate text-sm font-semibold text-[#e8f0fe]">
										{selectedTopic?.label}
									</h2>
									{selectedTopic?.root_cat && (
										<p className="truncate text-[0.7rem] text-[#5a7a9a]">
											{selectedTopic.root_cat}
											{selectedTopic.sub_cat && ` / ${selectedTopic.sub_cat}`}
										</p>
									)}
								</>
							)}
						</div>
						<span className="text-[0.65rem] text-[#5a7a9a]">ESC</span>
					</div>

					{/* Keywords */}
					{selectedTopic && selectedTopic.keywords.length > 0 && (
						<div className="flex flex-wrap gap-1 border-b border-[#4a6fa5]/10 px-4 py-2.5">
							{selectedTopic.keywords.map((kw) => (
								<span
									key={kw}
									className="rounded bg-[#4a6fa5]/15 px-2 py-0.5 text-[0.7rem] text-[#7eb4e2]"
								>
									{kw}
								</span>
							))}
						</div>
					)}

					{/* Segments list */}
					<div className="flex-1 overflow-y-auto px-4 py-3">
						{topicLoading ? (
							<div className="space-y-4">
								{[1, 2, 3].map((i) => (
									<div
										key={i}
										className="h-20 animate-pulse rounded-lg bg-[#4a6fa5]/10"
									/>
								))}
							</div>
						) : selectedTopic && selectedTopic.segments.length > 0 ? (
							<div className="space-y-4">
								{selectedTopic.segments.map((seg, i) => (
									<div
										key={`${seg.conversation_uuid}-${i}`}
										className="rounded-lg border border-[#4a6fa5]/10 bg-[#0a1024]/60 p-3"
									>
										<p className="mb-2 text-[0.7rem] font-medium text-[#5a7a9a]">
											{seg.conversation_name}
										</p>
										<div className="space-y-1.5">
											{seg.messages.map((msg, j) => (
												<p
													key={j}
													className={`text-[0.78rem] leading-relaxed ${
														msg.sender === "human"
															? "text-[#c8d6e5]"
															: "text-[#7eb4e2]/80"
													}`}
												>
													<span className="mr-1.5 text-[0.65rem] uppercase text-[#5a7a9a]">
														{msg.sender === "human" ? "You" : "AI"}:
													</span>
													{msg.text.length > 400
														? `${msg.text.slice(0, 400)}...`
														: msg.text}
												</p>
											))}
										</div>
									</div>
								))}
							</div>
						) : (
							<p className="text-center text-sm text-[#5a7a9a]">
								No segments available
							</p>
						)}
					</div>
				</div>
			)}

			{/* Bottom info bar */}
			{!topicPanelOpen && (
				<div className="absolute bottom-3 left-3 z-10 rounded-lg border border-[#4a6fa5]/20 bg-[#0a1024]/85 px-3 py-1.5 text-[0.75rem] text-[#5a7a9a] backdrop-blur-sm">
					pinch to zoom &middot; drag to pan &middot; click constellation to
					focus
				</div>
			)}
		</div>
	);
}
