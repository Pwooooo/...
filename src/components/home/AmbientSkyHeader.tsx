"use client";

import React from "react";

const STARS: Array<{ x: number; y: number; r: number; o: number }> = [
  { x: 10, y: 28, r: 1.1, o: 0.65 },
  { x: 16, y: 52, r: 0.9, o: 0.45 },
  { x: 22, y: 36, r: 1.2, o: 0.55 },
  { x: 28, y: 64, r: 0.9, o: 0.35 },
  { x: 34, y: 30, r: 1.1, o: 0.55 },
  { x: 40, y: 56, r: 1.0, o: 0.45 },
  { x: 45, y: 26, r: 1.3, o: 0.7 },
  { x: 51, y: 48, r: 0.9, o: 0.4 },
  { x: 57, y: 34, r: 1.2, o: 0.6 },
  { x: 62, y: 68, r: 0.9, o: 0.35 },
  { x: 66, y: 28, r: 1.1, o: 0.6 },
  { x: 70, y: 52, r: 1.2, o: 0.5 },
  { x: 74, y: 74, r: 0.9, o: 0.32 },
  { x: 82, y: 24, r: 1.1, o: 0.5 },
  { x: 91, y: 32, r: 1.2, o: 0.55 },
  { x: 95, y: 58, r: 1.0, o: 0.4 },
];

export default function AmbientSkyHeader() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-0 right-0 left-0 md:left-[var(--sidebar-width,0px)] h-[280px] overflow-hidden select-none z-[1] [mask-image:linear-gradient(to_bottom,black_55%,transparent_100%)]"
    >
      {/* Dithered halftone dot-matrix halo centered around the crescent moon */}
      <div
        className="absolute top-0 right-[5%] sm:right-[9%] h-[260px] w-[360px] opacity-65"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.65) 1.1px, transparent 1.1px)",
          backgroundSize: "5px 5px",
          maskImage: "radial-gradient(circle at 55% 42%, black 0%, rgba(0,0,0,0.5) 40%, transparent 72%)",
          WebkitMaskImage:
            "radial-gradient(circle at 55% 42%, black 0%, rgba(0,0,0,0.5) 40%, transparent 72%)",
        }}
      />

      {/* Wider faint horizontal halftone trail fading left */}
      <div
        className="absolute top-8 right-[14%] h-[190px] w-[560px] opacity-35"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.55) 1px, transparent 1px)",
          backgroundSize: "6px 6px",
          maskImage: "radial-gradient(ellipse 72% 62% at 75% 45%, black 0%, transparent 76%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 72% 62% at 75% 45%, black 0%, transparent 76%)",
        }}
      />

      {/* Scattered stars */}
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
            r={s.r * 0.24}
            fill="white"
            fillOpacity={s.o}
          />
        ))}
      </svg>

      {/* Crisp Crescent Moon positioned cleanly below navbar */}
      <svg
        viewBox="0 0 64 64"
        className="absolute top-16 right-[10%] sm:right-[14%] h-12 w-12 text-white/45 drop-shadow-[0_0_18px_rgba(255,255,255,0.16)]"
        fill="currentColor"
      >
        <path d="M40.5 46.5c-10.2 0-18.5-8.3-18.5-18.5 0-6.2 3.1-11.7 7.8-15.1-1.3-.3-2.6-.4-4-.4C14.8 12.5 6 21.3 6 32.3s8.8 19.8 19.8 19.8c8.9 0 16.4-5.9 18.9-14-.9 5.1-2.5 8.4-4.2 8.4z" />
      </svg>
    </div>
  );
}
