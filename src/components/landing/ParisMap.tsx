"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

// Paris center coordinates
const PARIS_CENTER: [number, number] = [48.8566, 2.3522];
const DEFAULT_ZOOM = 13;

// Key Paris landmarks to mark
const LANDMARKS = [
  { name: "Eiffel Tower", lat: 48.8584, lng: 2.2945 },
  { name: "Mistral AI HQ", lat: 48.8738, lng: 2.3460 },
  { name: "Notre-Dame", lat: 48.853, lng: 2.3499 },
  { name: "Louvre", lat: 48.8606, lng: 2.3376 },
];

// Pixel art marker as SVG data URI
function pixelMarkerIcon(L: typeof import("leaflet"), color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
    <rect x="6" y="0" width="4" height="4" fill="${color}"/>
    <rect x="4" y="4" width="8" height="4" fill="${color}"/>
    <rect x="2" y="8" width="12" height="4" fill="${color}"/>
    <rect x="6" y="12" width="4" height="4" fill="${color}" opacity="0.5"/>
  </svg>`;
  return L.icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svg)}`,
    iconSize: [16, 16],
    iconAnchor: [8, 16],
    popupAnchor: [0, -16],
  });
}

export function ParisMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<import("leaflet").Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Dynamic import to avoid SSR issues
    import("leaflet").then((L) => {
      if (!mapRef.current) return;

      const map = L.map(mapRef.current, {
        center: PARIS_CENTER,
        zoom: DEFAULT_ZOOM,
        zoomControl: true,
        attributionControl: true,
      });

      // Dark tile layer (CartoDB Dark Matter - free, no API key needed)
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | <a href="https://citymapper.com/paris">Open in Citymapper</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }
      ).addTo(map);

      // Add pixel markers for landmarks
      const orangeMarker = pixelMarkerIcon(L, "#f97316");
      const redMarker = pixelMarkerIcon(L, "#ef4444");

      LANDMARKS.forEach((lm, i) => {
        L.marker([lm.lat, lm.lng], {
          icon: i === 1 ? redMarker : orangeMarker,
        })
          .addTo(map)
          .bindPopup(
            `<span style="font-family:monospace;font-size:11px;color:#f97316">${lm.name}</span>`
          );
      });

      mapInstanceRef.current = map;
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full">
      {/* Map container */}
      <div
        ref={mapRef}
        className="w-full rounded-lg border-2 border-[#2a2a4e] pixel-render"
        style={{ height: "360px" }}
      />

      {/* Paris label */}
      <div className="absolute bottom-4 right-4 z-[1000] flex items-center gap-2 rounded bg-[#1a1a2e]/80 border border-[#2a2a4e] px-3 py-2">
        <span className="font-pixel text-[8px] text-[#f97316]">Paris</span>
      </div>
    </div>
  );
}
