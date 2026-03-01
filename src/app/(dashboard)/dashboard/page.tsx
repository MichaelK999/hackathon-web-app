"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CategorySelector } from "@/components/dashboard/CategorySelector";
import { PipelineControls } from "@/components/dashboard/PipelineControls";
import { PipelineProgress } from "@/components/dashboard/PipelineProgress";
import { useGraphData } from "@/hooks/useGraphData";
import { useNotes } from "@/hooks/useNotes";
import { usePipelineSSE } from "@/hooks/usePipelineSSE";
import { continuePipeline, startPipeline } from "@/lib/api";

// Dynamic import: 3d-force-graph uses window/WebGL, can't render on server
const GraphVisualization = dynamic(
	() =>
		import("@/components/dashboard/GraphVisualization").then(
			(m) => m.GraphVisualization,
		),
	{
		ssr: false,
		loading: () => (
			<div className="flex h-full items-center justify-center bg-[#0b1120] text-[#94a3b8] text-sm">
				Loading graph...
			</div>
		),
	},
);

export default function DashboardPage() {
	const pipeline = usePipelineSSE();
	const graph = useGraphData();
	const notes = useNotes();
	const notesStartedRef = useRef(false);
	const [currentRunId, setCurrentRunId] = useState<string | null>(null);

	// Feed SSE events into graph data manager
	useEffect(() => {
		if (pipeline.latestEvent) {
			graph.processEvent(pipeline.latestEvent);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pipeline.latestEvent]);

	// Start polling notes when pipeline completes
	useEffect(() => {
		if (pipeline.phase === "done" && !notesStartedRef.current) {
			notesStartedRef.current = true;
			notes.startPolling();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pipeline.phase]);

	const handleStart = async (params: {
		session_key: string;
		last_active_org: string;
	}) => {
		try {
			graph.reset();
			pipeline.reset();
			notes.stopPolling();
			notesStartedRef.current = false;
			setCurrentRunId(null);
			const { run_id } = await startPipeline(params);
			setCurrentRunId(run_id);
			pipeline.connect(run_id);
		} catch (err) {
			console.error("Failed to start pipeline:", err);
		}
	};

	const handleContinue = async (excludedCategories: string[]) => {
		if (!currentRunId) return;
		try {
			await continuePipeline({
				run_id: currentRunId,
				excluded_categories: excludedCategories,
			});
		} catch (err) {
			console.error("Failed to continue pipeline:", err);
		}
	};

	return (
		<div className="flex h-screen">
			{/* Sidebar */}
			<aside className="flex w-80 shrink-0 flex-col gap-6 overflow-y-auto border-r border-border bg-[#fdf6ee] p-5">
				<PipelineControls
					onStart={handleStart}
					isRunning={pipeline.isRunning}
				/>

				<PipelineProgress
					phase={pipeline.phase}
					message={pipeline.message}
					progress={pipeline.progress}
					error={pipeline.error}
				/>

				{pipeline.isAwaitingReview && pipeline.scanResult && (
					<CategorySelector
						scanResult={pipeline.scanResult}
						onContinue={handleContinue}
					/>
				)}

				{/* Node count */}
				{graph.data.nodes.length > 0 && (
					<div className="text-xs text-muted-foreground">
						{graph.data.nodes.length} nodes &middot; {graph.data.links.length}{" "}
						links
					</div>
				)}

				{/* Skill Tree link */}
				{graph.data.nodes.length > 0 && (
					<Link
						href="/skill-tree"
						className="mt-auto rounded-lg border border-[#4a6fa5]/30 bg-[#08051a] px-4 py-2.5 text-center text-sm font-medium text-[#7eb4e2] transition-colors hover:border-[#4a6fa5]/60 hover:text-[#a0c4ff]"
					>
						Open Skill Tree
					</Link>
				)}
			</aside>

			{/* Main graph area */}
			<main className="relative flex-1 bg-[#08051a]">
				<GraphVisualization data={graph.data} />

				{/* Download notes button (top-right of graph area) */}
				{pipeline.phase === "done" && (
					<button
						type="button"
						onClick={notes.downloadZip}
						disabled={notes.generating || notes.count === 0}
						className="absolute right-3 top-3 z-50 flex items-center justify-center gap-2 rounded-lg border border-[#4a6fa5]/30 bg-[#0a1024] px-3 py-2 text-sm font-medium text-[#7eb4e2] transition-colors hover:border-[#4a6fa5]/70 hover:text-[#a0c4ff] disabled:cursor-not-allowed disabled:opacity-60"
					>
						{notes.generating && (
							<svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
								<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
								<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
							</svg>
						)}
						{notes.generating
							? `Generating Notes (${notes.count})...`
							: `Download Notes (${notes.count})`}
					</button>
				)}
			</main>
		</div>
	);
}
