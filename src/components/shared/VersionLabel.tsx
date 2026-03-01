"use client";

import { useEffect, useState } from "react";

const FRONTEND_VERSION = 6;

export function VersionLabel() {
	const [backendVersion, setBackendVersion] = useState<number | null>(null);

	useEffect(() => {
		const base = process.env.NEXT_PUBLIC_API_BASE_URL;
		if (!base) return;
		fetch(`${base}/api/version`, { credentials: "include" })
			.then((r) => r.json())
			.then((data: { version: number }) => setBackendVersion(data.version))
			.catch(() => {});
	}, []);

	return (
		<span className="fixed bottom-2 left-2 z-50 text-xs text-gray-400 pointer-events-none select-none">
			fe:v{FRONTEND_VERSION}
			{backendVersion !== null ? ` · be:v${backendVersion}` : ""}
		</span>
	);
}
