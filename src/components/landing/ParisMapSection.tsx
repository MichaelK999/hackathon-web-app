"use client";

import dynamic from "next/dynamic";

const ParisMap = dynamic(
  () => import("@/components/landing/ParisMap").then((m) => m.ParisMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full rounded-lg border-2 border-[#2a2a4e] bg-[#1a1a2e] flex items-center justify-center"
        style={{ height: "360px" }}
      >
        <span className="font-pixel text-[10px] text-[#4b5563]">
          Loading map...
        </span>
      </div>
    ),
  }
);

export function ParisMapSection() {
  return (
    <section className="w-full px-6 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 text-center">
          <h3 className="font-pixel text-sm text-[#f97316] mb-1">
            Explore Paris
          </h3>
          <p className="text-xs text-[#6b7280]">Made with ❤️ at Mistral AI Hack</p>
        </div>
        <ParisMap />
      </div>
    </section>
  );
}
