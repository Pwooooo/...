"use client";

import React, { useEffect, useRef } from "react";

interface Flake {
  x: number;
  y: number;
  r: number;
  vy: number;
  vx: number;
  alpha: number;
  phase: number;
  swayAmp: number;
  swayFreq: number;
}

export default function SnowOverlay() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionQuery.matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    const flakeCount = Math.min(80, Math.max(36, Math.floor(width / 22)));
    const createFlake = (randomY: boolean): Flake => ({
      x: Math.random() * width,
      y: randomY ? Math.random() * height : -8 - Math.random() * 24,
      r: 0.9 + Math.random() * 1.6,
      vy: 18 + Math.random() * 28,
      vx: -6 + Math.random() * 14,
      alpha: 0.16 + Math.random() * 0.36,
      phase: Math.random() * Math.PI * 2,
      swayAmp: 6 + Math.random() * 12,
      swayFreq: 0.4 + Math.random() * 0.7,
    });

    const flakes: Flake[] = Array.from({ length: flakeCount }, () => createFlake(true));

    let rafId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < flakes.length; i++) {
        const f = flakes[i];
        f.phase += f.swayFreq * dt;
        f.y += f.vy * dt;
        f.x += (f.vx + Math.sin(f.phase) * f.swayAmp) * dt;

        if (f.y > height + 10) {
          flakes[i] = createFlake(false);
          continue;
        }
        if (f.x < -12) f.x = width + 10;
        else if (f.x > width + 12) f.x = -10;

        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${f.alpha})`;
        ctx.fill();
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    window.addEventListener("resize", resize);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[36] select-none"
    />
  );
}
