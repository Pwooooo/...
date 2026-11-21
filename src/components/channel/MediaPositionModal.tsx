"use client";

import React, { useState, useRef, useEffect } from "react";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

export interface MediaPosition {
  x: number; // 0..100 (%)
  y: number; // 0..100 (%)
  zoom: number; // 1..3
}

interface MediaPositionModalProps {
  isOpen: boolean;
  mode: "avatar" | "banner";
  previewUrl: string;
  isVideo: boolean;
  isAnimated: boolean;
  initialPosition?: MediaPosition;
  onCancel: () => void;
  onDone: (result: { croppedDataUrl?: string; position: MediaPosition }) => void;
}

export default function MediaPositionModal({
  isOpen,
  mode,
  previewUrl,
  isVideo,
  isAnimated,
  initialPosition,
  onCancel,
  onDone,
}: MediaPositionModalProps) {
  const [pos, setPos] = useState<MediaPosition>(
    initialPosition || { x: 50, y: 50, zoom: 1 }
  );
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ clientX: number; clientY: number; startX: number; startY: number } | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPos(initialPosition || { x: 50, y: 50, zoom: 1 });
    }
  }, [isOpen, previewUrl, initialPosition]);

  if (!isOpen || !previewUrl) return null;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startX: pos.x,
      startY: pos.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRef.current || !frameRef.current) return;
    const rect = frameRef.current.getBoundingClientRect();
    const dx = e.clientX - dragStartRef.current.clientX;
    const dy = e.clientY - dragStartRef.current.clientY;
    // Dragging image right moves object-position left (smaller %), scaled for smooth control
    const sensitivity = 100 / Math.max(rect.width, rect.height);
    const nextX = Math.max(0, Math.min(100, dragStartRef.current.startX - dx * sensitivity));
    const nextY = Math.max(0, Math.min(100, dragStartRef.current.startY - dy * sensitivity));
    setPos((prev) => ({ ...prev, x: nextX, y: nextY }));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const handleConfirm = () => {
    // For static images, bake the exact crop + zoom onto canvas for clean portability
    if (!isAnimated && !isVideo && imgRef.current && imgRef.current.naturalWidth > 0) {
      const img = imgRef.current;
      const outW = mode === "banner" ? 1600 : 512;
      const outH = mode === "banner" ? 400 : 512;
      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        const iw = img.naturalWidth;
        const ih = img.naturalHeight;
        // Cover scale * user zoom
        const baseScale = Math.max(outW / iw, outH / ih);
        const drawW = iw * baseScale * pos.zoom;
        const drawH = ih * baseScale * pos.zoom;
        const offsetX = (outW - drawW) * (pos.x / 100);
        const offsetY = (outH - drawH) * (pos.y / 100);

        ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
        try {
          const croppedDataUrl = canvas.toDataURL("image/jpeg", 0.92);
          onDone({ croppedDataUrl, position: { x: 50, y: 50, zoom: 1 } });
          return;
        } catch {
          // Cross-origin tainted canvas fallback -> use non-destructive CSS position
        }
      }
    }

    onDone({ position: pos });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl rounded-2xl bg-[#1f1f1f] border border-white/[0.08] p-6 shadow-2xl text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white">
            {mode === "avatar" ? "Customize picture" : "Customize banner"}
          </h3>
          <span className="text-xs text-zinc-400">Drag to position • Use slider to zoom</span>
        </div>

        {/* Crop Stage */}
        <div className="relative flex items-center justify-center bg-[#121212] rounded-xl py-8 px-4 overflow-hidden select-none">
          <div
            ref={frameRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className={`relative overflow-visible cursor-grab active:cursor-grabbing touch-none ${
              mode === "avatar"
                ? "w-60 h-60 sm:w-64 sm:h-64"
                : "w-full max-w-[520px] aspect-[16/4]"
            }`}
          >
            {/* Clipped Media */}
            <div className="absolute inset-0 overflow-hidden bg-black">
              {isVideo ? (
                <video
                  src={previewUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  draggable={false}
                  style={{
                    objectPosition: `${pos.x}% ${pos.y}%`,
                    transform: `scale(${pos.zoom})`,
                  }}
                  className="h-full w-full object-cover pointer-events-none select-none"
                />
              ) : (
                <img
                  ref={imgRef}
                  src={previewUrl}
                  alt="Position preview"
                  crossOrigin="anonymous"
                  draggable={false}
                  style={{
                    objectPosition: `${pos.x}% ${pos.y}%`,
                    transform: `scale(${pos.zoom})`,
                  }}
                  className="h-full w-full object-cover pointer-events-none select-none"
                />
              )}
            </div>

            {/* Dimmed outer mask + YouTube-style blue crop frame */}
            <div className="pointer-events-none absolute inset-0 border-2 border-[#3ea6ff] shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]">
              {/* Corner handles */}
              <span className="absolute -top-1.5 -left-1.5 h-2.5 w-2.5 bg-white border border-black" />
              <span className="absolute -top-1.5 -right-1.5 h-2.5 w-2.5 bg-white border border-black" />
              <span className="absolute -bottom-1.5 -left-1.5 h-2.5 w-2.5 bg-white border border-black" />
              <span className="absolute -bottom-1.5 -right-1.5 h-2.5 w-2.5 bg-white border border-black" />
              {mode === "avatar" && (
                <div className="absolute inset-0 rounded-full border border-[#3ea6ff]/90" />
              )}
            </div>
          </div>
        </div>

        {/* Zoom Controls & Actions */}
        <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <ZoomOut className="h-4 w-4 text-zinc-400 flex-shrink-0" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={pos.zoom}
              onChange={(e) => setPos((prev) => ({ ...prev, zoom: parseFloat(e.target.value) }))}
              className="w-full sm:w-44 accent-white cursor-pointer"
              aria-label="Zoom"
            />
            <ZoomIn className="h-4 w-4 text-zinc-400 flex-shrink-0" />
            <button
              type="button"
              onClick={() => setPos({ x: 50, y: 50, zoom: 1 })}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
              title="Reset position"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2 rounded-full bg-white hover:bg-zinc-200 text-xs font-bold text-black transition-colors cursor-pointer shadow-sm"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
