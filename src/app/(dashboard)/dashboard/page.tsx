"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { PipelineControls } from "@/components/dashboard/PipelineControls";
import { PipelineProgress } from "@/components/dashboard/PipelineProgress";
import { useGraphData } from "@/hooks/useGraphData";
import { usePipelineSSE } from "@/hooks/usePipelineSSE";
import { startPipeline } from "@/lib/api";

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

	// Feed SSE events into graph data manager
	useEffect(() => {
		if (pipeline.latestEvent) {
			graph.processEvent(pipeline.latestEvent);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pipeline.latestEvent]);

	const handleStart = async (params: {
		session_key: string;
		last_active_org: string;
		max_conversations: number;
	}) => {
		try {
			graph.reset();
			pipeline.reset();
			const { run_id } = await startPipeline(params);
			pipeline.connect(run_id);
		} catch (err) {
			console.error("Failed to start pipeline:", err);
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

				{/* Node count */}
				{graph.data.nodes.length > 0 && (
					<div className="text-xs text-muted-foreground">
						{graph.data.nodes.length} nodes &middot; {graph.data.links.length}{" "}
						links
					</div>
				)}
			</aside>

			{/* Main graph area */}
			<main className="flex-1 bg-[#08051a]">
				<GraphVisualization data={graph.data} />
			</main>
		</div>
	);
}
