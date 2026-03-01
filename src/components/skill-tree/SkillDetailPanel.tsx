"use client";

import { useState } from "react";
import { unlockSkill } from "@/lib/api";
import type { LayoutNode } from "./SkillTreeCanvas";

interface SkillDetailPanelProps {
	node: LayoutNode;
	onClose: () => void;
	onUnlocked: (label: string) => void;
}

export function SkillDetailPanel({
	node,
	onClose,
	onUnlocked,
}: SkillDetailPanelProps) {
	const [unlocking, setUnlocking] = useState(false);
	const [isUnlocked, setIsUnlocked] = useState(node.status === "unlocked");

	const handleUnlock = async () => {
		setUnlocking(true);
		try {
			await unlockSkill(node.label);
			setIsUnlocked(true);
			onUnlocked(node.label);
		} catch (err) {
			console.error("Failed to unlock skill:", err);
		} finally {
			setUnlocking(false);
		}
	};

	return (
		<div className="absolute inset-y-0 right-0 z-20 flex w-full max-w-lg flex-col border-l border-[#4a6fa5]/20 bg-[#080e1e]/95 backdrop-blur-lg">
			{/* Header */}
			<div className="flex items-center gap-3 border-b border-[#4a6fa5]/15 px-4 py-3">
				<button
					type="button"
					onClick={onClose}
					className="flex h-8 w-8 items-center justify-center rounded-md border border-[#4a6fa5]/30 text-[#7eb4e2] transition-colors hover:border-[#4a6fa5]/60 hover:text-[#a0c4ff]"
					title="Back (Esc)"
				>
					&larr;
				</button>
				<div className="min-w-0 flex-1">
					<h2 className="truncate text-sm font-semibold text-[#e8f0fe]">
						{node.label}
					</h2>
					{node.breadcrumb && (
						<p className="truncate text-[0.7rem] text-[#5a7a9a]">
							{node.breadcrumb}
						</p>
					)}
				</div>
				<span className="text-[0.65rem] text-[#5a7a9a]">ESC</span>
			</div>

			{/* Keywords */}
			{node.keywords.length > 0 && (
				<div className="flex flex-wrap gap-1 border-b border-[#4a6fa5]/10 px-4 py-2.5">
					{node.keywords.map((kw) => (
						<span
							key={kw}
							className="rounded bg-[#4a6fa5]/15 px-2 py-0.5 text-[0.7rem] text-[#7eb4e2]"
						>
							{kw}
						</span>
					))}
				</div>
			)}

			{/* Body */}
			<div className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
				{/* Status indicator */}
				<div className="flex flex-col items-center gap-3">
					{isUnlocked ? (
						<>
							<div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-emerald-400/40 bg-emerald-400/10">
								<svg
									className="h-8 w-8 text-emerald-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M5 13l4 4L19 7"
									/>
								</svg>
							</div>
							<p className="text-sm font-medium text-emerald-400">
								Skill Unlocked
							</p>
						</>
					) : (
						<>
							<div
								className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#4a6fa5]/30 bg-[#4a6fa5]/10"
								style={{ borderColor: `${node.color}40` }}
							>
								<svg
									className="h-8 w-8 text-[#5a7a9a]"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
									/>
								</svg>
							</div>
							<p className="text-sm font-medium text-[#5a7a9a]">
								Skill Locked
							</p>
						</>
					)}
				</div>

				{/* Stats */}
				<div className="flex gap-6 text-center">
					<div>
						<p className="text-lg font-semibold text-[#e8f0fe]">
							{node.segmentCount}
						</p>
						<p className="text-[0.7rem] text-[#5a7a9a]">Segments</p>
					</div>
					<div>
						<p className="text-lg font-semibold text-[#e8f0fe]">
							{node.keywords.length}
						</p>
						<p className="text-[0.7rem] text-[#5a7a9a]">Keywords</p>
					</div>
				</div>

				{/* Unlock button */}
				{!isUnlocked && (
					<button
						type="button"
						onClick={handleUnlock}
						disabled={unlocking}
						className="rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-all hover:brightness-110 disabled:opacity-50"
						style={{ backgroundColor: node.color }}
					>
						{unlocking ? "Unlocking..." : "Take Test"}
					</button>
				)}
			</div>
		</div>
	);
}
