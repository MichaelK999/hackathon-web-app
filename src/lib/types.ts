/** Pipeline phase names — mirrors backend PipelinePhase enum */
export type PipelinePhase =
	| "fetching"
	| "embedding"
	| "segmenting"
	| "clustering"
	| "labeling"
	| "hierarchy"
	| "done"
	| "error";

/** A single node in the knowledge graph */
export interface GraphNode {
	id: string;
	name: string;
	level: number;
	segment_count: number;
	type: "root" | "subcategory" | "topic";
	keywords?: string[];
}

/** A directional link between graph nodes */
export interface GraphLink {
	source: string;
	target: string;
}

/** Complete graph data payload */
export interface GraphData {
	nodes: GraphNode[];
	links: GraphLink[];
}

/** SSE progress event from the pipeline */
export interface PipelineProgressEvent {
	phase: PipelinePhase;
	message: string;
	progress: number; // 0.0 – 1.0
	node?: GraphNode;
	graph_snapshot?: GraphData;
}

/** Topic detail from GET /api/topic/{label} */
export interface TopicDetail {
	label: string;
	keywords: string[];
	segments: TopicSegment[];
	root_cat: string | null;
	sub_cat: string | null;
}

export interface TopicSegment {
	conversation_name: string;
	conversation_uuid: string;
	messages: { sender: string; text: string }[];
}

/** POST /get-cookies request body */
export interface PipelineStartRequest {
	session_key: string;
	last_active_org: string;
	max_conversations?: number;
}

/** POST /api/pipeline/start response */
export interface PipelineStartResponse {
	run_id: string;
	status: string;
}

/** A single skill node in the constellation tree */
export interface SkillNode {
	label: string;
	keywords: string[];
	segment_count: number;
	status: "locked" | "unlocked";
}

/** Skill tree: root → subcategory → topics */
export interface SkillTree {
	tree: Record<string, Record<string, SkillNode[]>>;
}

/** Response from POST /api/skills/{label}/unlock */
export interface SkillUnlockResponse {
	label: string;
	status: "unlocked";
}

/** GET /api/notes — bulk poll */
export interface NotesResponse {
	notes: Record<string, string>;
	count: number;
	generating: boolean;
}

/** GET /api/notes/{label} — single note */
export interface SingleNoteResponse {
	label: string;
	markdown: string;
	cached: boolean;
}
