import type {
	GraphData,
	PipelineStartRequest,
	PipelineStartResponse,
	TopicDetail,
} from "./types";

function getApiBase(): string {
	const base = process.env.NEXT_PUBLIC_API_BASE_URL;
	if (!base)
		throw new Error("NEXT_PUBLIC_API_BASE_URL environment variable is not set");
	return base;
}

/** Start a new pipeline run on the backend. */
export async function startPipeline(
	params: PipelineStartRequest,
): Promise<PipelineStartResponse> {
	const res = await fetch(`${getApiBase()}/api/pipeline/start`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(params),
	});
	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		throw new Error(
			(body as { detail?: string }).detail ?? `HTTP ${res.status}`,
		);
	}
	return res.json() as Promise<PipelineStartResponse>;
}

/** Construct SSE URL for streaming pipeline progress. */
export function createPipelineSSEUrl(runId: string): string {
	return `${getApiBase()}/api/pipeline/stream/${runId}`;
}

/** Fetch graph data for a specific run (or global data if no runId). */
export async function fetchGraphData(runId?: string): Promise<GraphData> {
	const url = runId
		? `${getApiBase()}/api/graph-data?run_id=${runId}`
		: `${getApiBase()}/api/graph-data`;
	const res = await fetch(url);
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	return res.json() as Promise<GraphData>;
}

/** Fetch topic detail (segments, keywords, breadcrumb). */
export async function fetchTopicDetail(label: string): Promise<TopicDetail> {
	const res = await fetch(
		`${getApiBase()}/api/topic/${encodeURIComponent(label)}`,
	);
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	return res.json() as Promise<TopicDetail>;
}
