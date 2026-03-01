import type {
	GraphData,
	NotesResponse,
	PipelineStartRequest,
	PipelineStartResponse,
	SingleNoteResponse,
	SkillTree,
	SkillUnlockResponse,
	TopicDetail,
} from "./types";

function getApiBase(): string {
	const base = process.env.NEXT_PUBLIC_API_BASE_URL;
	if (!base)
		throw new Error("NEXT_PUBLIC_API_BASE_URL environment variable is not set");
	return base;
}

/** Fetch the visible conversation count from Claude.ai (matches web UI). */
export async function countConversations(params: {
	session_key: string;
	last_active_org: string;
}): Promise<number> {
	const res = await fetch(`${getApiBase()}/count-conversations`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(params),
		credentials: "include",
	});
	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		throw new Error(
			(body as { detail?: string }).detail ?? `HTTP ${res.status}`,
		);
	}
	const data = (await res.json()) as { count: number };
	return data.count;
}

/** Start a new pipeline run on the backend. */
export async function startPipeline(
	params: PipelineStartRequest,
): Promise<PipelineStartResponse> {
	const res = await fetch(`${getApiBase()}/api/pipeline/start`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(params),
		credentials: "include",
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
	const res = await fetch(url, { credentials: "include" });
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	return res.json() as Promise<GraphData>;
}

/** Fetch topic detail (segments, keywords, breadcrumb). */
export async function fetchTopicDetail(label: string): Promise<TopicDetail> {
	const res = await fetch(
		`${getApiBase()}/api/topic/${encodeURIComponent(label)}`,
		{ credentials: "include" },
	);
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	return res.json() as Promise<TopicDetail>;
}

/** Fetch the full skill tree with unlock status. */
export async function fetchSkillTree(): Promise<SkillTree> {
	const res = await fetch(`${getApiBase()}/api/skills`, {
		credentials: "include",
	});
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	return res.json() as Promise<SkillTree>;
}

/** Unlock a skill (placeholder — no quiz yet). */
export async function unlockSkill(label: string): Promise<SkillUnlockResponse> {
	const res = await fetch(
		`${getApiBase()}/api/skills/${encodeURIComponent(label)}/unlock`,
		{ method: "POST", credentials: "include" },
	);
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	return res.json() as Promise<SkillUnlockResponse>;
}

/** Poll all notes generation status. */
export async function fetchNotes(): Promise<NotesResponse> {
	const res = await fetch(`${getApiBase()}/api/notes`, {
		credentials: "include",
	});
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	return res.json() as Promise<NotesResponse>;
}

/** Fetch a single note by topic label. */
export async function fetchNote(label: string): Promise<SingleNoteResponse> {
	const res = await fetch(
		`${getApiBase()}/api/notes/${encodeURIComponent(label)}`,
		{ credentials: "include" },
	);
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	return res.json() as Promise<SingleNoteResponse>;
}
