import { PixelLondonSkyline } from "./PixelLondonSkyline";

export function Hero() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center px-6 pt-8 pb-4">
      {/* Project name */}
      <div className="mb-2 text-center">
        <h1 className="font-pixel text-3xl md:text-5xl text-white leading-relaxed mb-3">
          Shannon
        </h1>
        <p className="text-sm md:text-base text-[#9ca3af] max-w-lg">
          Turn your conversations into knowledge graphs, skill trees, and study
          materials
        </p>
      </div>

      <div className="mt-4 mb-8" />

      {/* London Skyline */}
      <div className="w-full max-w-4xl">
        <PixelLondonSkyline />
      </div>
    </section>
  );
}
