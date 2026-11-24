"use client";

import React from "react";

const STARS: Array<{ x: number; y: number; r: number; o: number }> = [
  { x: 12, y: 14, r: 1, o: 0.35 },
  { x: 18, y: 38, r: 0.8, o: 0.2 },
  { x: 24, y: 22, r: 1.1, o: 0.3 },
  { x: 29, y: 52, r: 0.8, o: 0.18 },
  { x: 35, y: 18, r: 1, o: 0.28 },
  { x: 41, y: 44, r: 0.9, o: 0.22 },
  { x: 46, y: 12, r: 1.2, o: 0.38 },
  { x: 52, y: 36, r: 0.8, o: 0.2 },
  { x: 58, y: 24, r: 1.1, o: 0.32 },
  { x: 63, y: 58, r: 0.8, o: 0.16 },
  { x: 67, y: 16, r: 1, o: 0.3 },
  { x: 71, y: 42, r: 1.1, o: 0.26 },
  { x: 75, y: 66, r: 0.8, o: 0.15 },
  { x: 82, y: 12, r: 1, o: 0.25 },
  { x: 91, y: 20, r: 1.1, o: 0.28 },
  { x: 95, y: 48, r: 0.9, o: 0.2 },
];

export default function AmbientSkyHeader() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-0 right-0 left-0 md:left-[var(--sidebar-width,0px)] h-[240px] overflow-hidden select-none z-[1] [mask-image:linear-gradient(to_bottom,black_35%,transparent_100%)]"
    >
      {/* Dithered halftone dot-matrix halo centered around the crescent moon */}
      <div
        className="absolute -top-12 right-[6%] sm:right-[10%] h-[260px] w-[340px] opacity-35"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.45) 1px, transparent 1px)",
          backgroundSize: "5px 5px",
          maskImage: "radial-gradient(circle at 55% 45%, black 0%, rgba(0,0,0,0.45) 38%, transparent 72%)",
          WebkitMaskImage:
            "radial-gradient(circle at 55% 45%, black 0%, rgba(0,0,0,0.45) 38%, transparent 72%)",
        }}
      />

      {/* Wider faint horizontal halftone trail fading left */}
      <div
        className="absolute top-2 right-[14%] h-[180px] w-[520px] opacity-15"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)",
          backgroundSize: "6px 6px",
          maskImage: "radial-gradient(ellipse 70% 60% at 75% 45%, black 0%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 75% 45%, black 0%, transparent 75%)",
        }}
      />

      {/* Scattered stars + subtle crescent moon */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        {STARS.map((s, idx) => (
          <circle
            key={idx}
            cx={s.x}
            cy={s.y}
            r={s.r * 0.18}
            fill="white"
            fillOpacity={s.o}
          />
        ))}
      </svg>

      {/* Crisp Crescent Moon */}
      <svg
        viewBox="0 0 64 64"
        className="absolute top-8 right-[11%] sm:right-[15%] h-12 w-12 text-white/20 drop-shadow-[0_0_16px_rgba(255,255,255,0.08)]"
        fill="currentColor"
      >
        <path d="M40.5 46.5c-10.2 0-18.5-8.3-18.5-18.5 0-6.2 3.1-11.7 7.8-15.1-1.3-.3-2.6-.4-4-.4C14.8 12.5 6 21.3 6 32.3s8.8 19.8 19.8 19.8c8.9 0 16.4-5.9 18.9-14-.9 5.1-2.5 8.4-4.2 8.4z" />
      </svg>
    </div>
  );
}
