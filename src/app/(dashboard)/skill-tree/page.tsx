"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { SkillDetailPanel } from "@/components/skill-tree/SkillDetailPanel";
import { fetchSkillTree } from "@/lib/api";
import type { SkillTree } from "@/lib/types";

import type { LayoutNode } from "@/components/skill-tree/SkillTreeCanvas";

const SkillTreeCanvas = dynamic(
	() =>
		import("@/components/skill-tree/SkillTreeCanvas").then(
			(m) => m.SkillTreeCanvas,
		),
	{
		ssr: false,
		loading: () => (
			<div className="flex h-full items-center justify-center bg-[#08051a] text-sm text-[#5a7a9a]">
				Loading skill tree...
			</div>
		),
	},
);

export default function SkillTreePage() {
	const [tree, setTree] = useState<SkillTree>({ tree: {} });
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedNode, setSelectedNode] = useState<LayoutNode | null>(null);

	const loadTree = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const data = await fetchSkillTree();
			setTree(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load skill tree");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadTree();
	}, [loadTree]);

	const handleTopicClick = useCallback((node: LayoutNode) => {
		setSelectedNode(node);
	}, []);

	const handleClose = useCallback(() => {
		setSelectedNode(null);
	}, []);

	const handleUnlocked = useCallback(
		(label: string) => {
			// Update local state to reflect the unlock
			setTree((prev) => {
				const newTree = { ...prev.tree };
				for (const root of Object.keys(newTree)) {
					for (const sub of Object.keys(newTree[root])) {
						newTree[root][sub] = newTree[root][sub].map((t) =>
							t.label === label ? { ...t, status: "unlocked" as const } : t,
						);
					}
				}
				return { tree: newTree };
			});
			// Update the selected node too
			setSelectedNode((prev) =>
				prev && prev.label === label
					? { ...prev, status: "unlocked" }
					: prev,
			);
		},
		[],
	);

	// Escape key to close panel
	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && selectedNode) {
				setSelectedNode(null);
			}
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [selectedNode]);

	const isEmpty = Object.keys(tree.tree).length === 0;

	return (
		<div className="flex h-screen flex-col bg-[#08051a]">
			{/* Top bar */}
			<header className="flex shrink-0 items-center justify-between border-b border-[#4a6fa5]/15 bg-[#080e1e]/80 px-5 py-3 backdrop-blur-sm">
				<div className="flex items-center gap-4">
					<Link
						href="/dashboard"
						className="text-sm text-[#7eb4e2] transition-colors hover:text-[#a0c4ff]"
					>
						&larr; Dashboard
					</Link>
					<h1 className="text-sm font-semibold text-[#e8f0fe]">
						Skill Tree
					</h1>
				</div>
				{!loading && !isEmpty && (
					<button
						type="button"
						onClick={loadTree}
						className="rounded-md border border-[#4a6fa5]/30 px-3 py-1.5 text-xs text-[#7eb4e2] transition-colors hover:border-[#4a6fa5]/60"
					>
						Refresh
					</button>
				)}
			</header>

			{/* Main content */}
			<main className="relative flex-1">
				{loading ? (
					<div className="flex h-full items-center justify-center">
						<div className="text-sm text-[#5a7a9a]">
							Loading skill tree...
						</div>
					</div>
				) : error ? (
					<div className="flex h-full flex-col items-center justify-center gap-3">
						<p className="text-sm text-red-400">{error}</p>
						<button
							type="button"
							onClick={loadTree}
							className="rounded-md border border-[#4a6fa5]/30 px-4 py-2 text-sm text-[#7eb4e2] transition-colors hover:border-[#4a6fa5]/60"
						>
							Retry
						</button>
					</div>
				) : isEmpty ? (
					<div className="flex h-full flex-col items-center justify-center gap-3">
						<p className="text-sm text-[#5a7a9a]">
							No topics yet. Run the pipeline first to populate your skill tree.
						</p>
						<Link
							href="/dashboard"
							className="rounded-md border border-[#4a6fa5]/30 px-4 py-2 text-sm text-[#7eb4e2] transition-colors hover:border-[#4a6fa5]/60"
						>
							Go to Dashboard
						</Link>
					</div>
				) : (
					<>
						<SkillTreeCanvas
							data={tree}
							onTopicClick={handleTopicClick}
						/>
						{selectedNode && (
							<SkillDetailPanel
								node={selectedNode}
								onClose={handleClose}
								onUnlocked={handleUnlocked}
							/>
						)}
					</>
				)}
			</main>
		</div>
	);
}
