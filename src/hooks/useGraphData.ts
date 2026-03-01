"use client";

import { useCallback, useRef, useState } from "react";
import type { GraphData, GraphNode, PipelineProgressEvent } from "@/lib/types";

const EMPTY_GRAPH: GraphData = { nodes: [], links: [] };

/**
 * Manages progressive graph state as pipeline events arrive.
 *
 * - During labeling: each event with a `node` → appends to graph
 * - After hierarchy: event with `graph_snapshot` → replaces entire graph
 */
export function useGraphData() {
  const [data, setData] = useState<GraphData>(EMPTY_GRAPH);
  const seenNodeIds = useRef(new Set<string>());

  /** Process a single SSE event to update graph state. */
  const processEvent = useCallback((event: PipelineProgressEvent) => {
    // Full graph snapshot (sent at end with hierarchy)
    if (event.graph_snapshot) {
      seenNodeIds.current = new Set(
        event.graph_snapshot.nodes.map((n) => n.id)
      );
      setData(event.graph_snapshot);
      return;
    }

    // Progressive node addition during labeling
    if (event.node && !seenNodeIds.current.has(event.node.id)) {
      const newNode: GraphNode = event.node;
      seenNodeIds.current.add(newNode.id);
      setData((prev) => ({
        nodes: [...prev.nodes, newNode],
        links: prev.links, // links come with hierarchy snapshot
      }));
    }
  }, []);

  /** Reset graph to empty state. */
  const reset = useCallback(() => {
    seenNodeIds.current.clear();
    setData(EMPTY_GRAPH);
  }, []);

  return { data, processEvent, reset };
}
