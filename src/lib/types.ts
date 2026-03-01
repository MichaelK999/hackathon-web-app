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

/** POST /api/pipeline/start request body */
export interface PipelineStartRequest {
	session_key: string;
	last_active_org: string;
	max_conversations: number;
}

/** POST /api/pipeline/start response */
export interface PipelineStartResponse {
	run_id: string;
	status: string;
}
