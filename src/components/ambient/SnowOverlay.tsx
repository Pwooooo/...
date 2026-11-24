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

interface SnowOverlayProps {
  className?: string;
}

export default function SnowOverlay({
  className = "pointer-events-none absolute inset-0 h-full w-full select-none",
}: SnowOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = canvas.clientWidth || 240;
    let height = canvas.clientHeight || window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const createFlake = (randomY: boolean, w: number, h: number): Flake => ({
      x: Math.random() * w,
      y: randomY ? Math.random() * h : -8 - Math.random() * 20,
      r: 1.1 + Math.random() * 1.7,
      vy: 18 + Math.random() * 26,
      vx: -4 + Math.random() * 9,
      alpha: 0.22 + Math.random() * 0.4,
      phase: Math.random() * Math.PI * 2,
      swayAmp: 5 + Math.random() * 9,
      swayFreq: 0.45 + Math.random() * 0.75,
    });

    let flakes: Flake[] = [];

    const syncSize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const targetCount = Math.max(12, Math.min(36, Math.floor((width * height) / 6800)));
      if (flakes.length === 0) {
        flakes = Array.from({ length: targetCount }, () => createFlake(true, width, height));
      } else if (flakes.length < targetCount) {
        while (flakes.length < targetCount) {
          flakes.push(createFlake(true, width, height));
        }
      } else if (flakes.length > targetCount) {
        flakes.length = targetCount;
      }
    };

    syncSize();

    const ro = new ResizeObserver(syncSize);
    ro.observe(canvas);
    window.addEventListener("resize", syncSize);

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

        if (f.y > height + 8) {
          flakes[i] = createFlake(false, width, height);
          continue;
        }
        if (f.x < -8) f.x = width + 6;
        else if (f.x > width + 8) f.x = -6;

        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${f.alpha})`;
        ctx.fill();
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener("resize", syncSize);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}
