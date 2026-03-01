"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchNotes } from "@/lib/api";
import JSZip from "jszip";

const POLL_INTERVAL = 3000;

export function useNotes() {
	const [notes, setNotes] = useState<Record<string, string>>({});
	const [count, setCount] = useState(0);
	const [generating, setGenerating] = useState(false);
	const [polling, setPolling] = useState(false);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const abortedRef = useRef(false);

	const stopPolling = useCallback(() => {
		abortedRef.current = true;
		setPolling(false);
		if (timerRef.current) {
			clearTimeout(timerRef.current);
			timerRef.current = null;
		}
	}, []);

	const poll = useCallback(async () => {
		try {
			const data = await fetchNotes();
			if (abortedRef.current) return;

			setNotes(data.notes);
			setCount(data.count);
			setGenerating(data.generating);

			if (data.generating) {
				timerRef.current = setTimeout(poll, POLL_INTERVAL);
			} else {
				setPolling(false);
			}
		} catch {
			if (!abortedRef.current) {
				timerRef.current = setTimeout(poll, POLL_INTERVAL);
			}
		}
	}, []);

	const startPolling = useCallback(() => {
		abortedRef.current = false;
		setPolling(true);
		poll();
	}, [poll]);

	useEffect(() => {
		return () => stopPolling();
	}, [stopPolling]);

	const downloadZip = useCallback(async () => {
		const data = await fetchNotes();
		const zip = new JSZip();
		for (const [label, markdown] of Object.entries(data.notes)) {
			zip.file(`${label}.md`, markdown);
		}
		const blob = await zip.generateAsync({ type: "blob" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "obsidian-notes.zip";
		a.click();
		URL.revokeObjectURL(url);
	}, []);

	return {
		notes,
		count,
		generating,
		polling,
		startPolling,
		stopPolling,
		downloadZip,
	};
}
