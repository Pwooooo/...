"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
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
  onCancel,
  onDone,
}: MediaPositionModalProps) {
  const [mediaSize, setMediaSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  // Crop box top-left in rendered media pixel coordinates
  const [cropOrigin, setCropOrigin] = useState<{ left: number; top: number }>({ left: 0, top: 0 });
  const [isDraggingBox, setIsDraggingBox] = useState(false);
  const [resizingCorner, setResizingCorner] = useState<"tl" | "tr" | "bl" | "br" | null>(null);

  const mediaRef = useRef<HTMLImageElement | HTMLVideoElement | null>(null);
  const sliderTrackRef = useRef<HTMLDivElement>(null);
  const dragBoxStartRef = useRef<{
    clientX: number;
    clientY: number;
    startLeft: number;
    startTop: number;
    startCw: number;
    startCh: number;
  } | null>(null);

  const targetAspect = mode === "banner" ? 4 : 1; // 16:4 = 4:1 for banner, 1:1 for avatar

  // Max crop box dimensions that fit inside the rendered media at zoom = 1
  const getCropDimensions = useCallback(
    (w: number, h: number, z: number) => {
      if (w <= 0 || h <= 0) return { cw: 0, ch: 0 };
      let maxW = w;
      let maxH = w / targetAspect;
      if (maxH > h) {
        maxH = h;
        maxW = h * targetAspect;
      }
      return {
        cw: maxW / z,
        ch: maxH / z,
      };
    },
    [targetAspect]
  );

  const clampOrigin = useCallback(
    (left: number, top: number, w: number, h: number, cw: number, ch: number) => ({
      left: Math.max(0, Math.min(w - cw, left)),
      top: Math.max(0, Math.min(h - ch, top)),
    }),
    []
  );

  const measureMedia = useCallback(() => {
    const el = mediaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setMediaSize({ w: rect.width, h: rect.height });
      const { cw, ch } = getCropDimensions(rect.width, rect.height, 1);
      setCropOrigin({
        left: (rect.width - cw) / 2,
        top: (rect.height - ch) / 2,
      });
      setZoom(1);
    }
  }, [getCropDimensions]);

  useEffect(() => {
    if (!isOpen) return;
    const onResize = () => measureMedia();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [isOpen, measureMedia]);

  if (!isOpen || !previewUrl) return null;

  const { cw, ch } = getCropDimensions(mediaSize.w, mediaSize.h, zoom);

  const updateZoom = (nextZoom: number) => {
    const clampedZoom = Math.max(1, Math.min(3, nextZoom));
    if (mediaSize.w > 0 && mediaSize.h > 0) {
      const oldDims = getCropDimensions(mediaSize.w, mediaSize.h, zoom);
      const newDims = getCropDimensions(mediaSize.w, mediaSize.h, clampedZoom);
      // Keep center of crop box fixed while zooming
      const centerX = cropOrigin.left + oldDims.cw / 2;
      const centerY = cropOrigin.top + oldDims.ch / 2;
      const nextOrigin = clampOrigin(
        centerX - newDims.cw / 2,
        centerY - newDims.ch / 2,
        mediaSize.w,
        mediaSize.h,
        newDims.cw,
        newDims.ch
      );
      setCropOrigin(nextOrigin);
    }
    setZoom(clampedZoom);
  };

  const handleBoxPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDraggingBox(true);
    dragBoxStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startLeft: cropOrigin.left,
      startTop: cropOrigin.top,
      startCw: cw,
      startCh: ch,
    };
  };

  const handleCornerPointerDown = (
    e: React.PointerEvent<HTMLSpanElement>,
    corner: "tl" | "tr" | "bl" | "br"
  ) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setResizingCorner(corner);
    dragBoxStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startLeft: cropOrigin.left,
      startTop: cropOrigin.top,
      startCw: cw,
      startCh: ch,
    };
  };

  const handleBoxPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragBoxStartRef.current) return;
    const { clientX, clientY, startLeft, startTop, startCw, startCh } = dragBoxStartRef.current;
    const dx = e.clientX - clientX;
    const dy = e.clientY - clientY;

    if (resizingCorner) {
      const baseMax = getCropDimensions(mediaSize.w, mediaSize.h, 1);
      const minW = baseMax.cw / 3;
      const anchorRight = startLeft + startCw;
      const anchorBottom = startTop + startCh;

      let rawW = startCw;
      if (resizingCorner === "br") rawW = Math.max(startCw + dx, (startCh + dy) * targetAspect);
      if (resizingCorner === "tr") rawW = Math.max(startCw + dx, (startCh - dy) * targetAspect);
      if (resizingCorner === "bl") rawW = Math.max(startCw - dx, (startCh + dy) * targetAspect);
      if (resizingCorner === "tl") rawW = Math.max(startCw - dx, (startCh - dy) * targetAspect);

      const maxWLeft = resizingCorner === "tl" || resizingCorner === "bl" ? anchorRight : mediaSize.w - startLeft;
      const maxHTop = resizingCorner === "tl" || resizingCorner === "tr" ? anchorBottom : mediaSize.h - startTop;
      const maxW = Math.min(baseMax.cw, maxWLeft, maxHTop * targetAspect);

      const nextW = Math.max(minW, Math.min(maxW, rawW));
      const nextH = nextW / targetAspect;
      const nextLeft = resizingCorner === "tl" || resizingCorner === "bl" ? anchorRight - nextW : startLeft;
      const nextTop = resizingCorner === "tl" || resizingCorner === "tr" ? anchorBottom - nextH : startTop;

      setCropOrigin({ left: nextLeft, top: nextTop });
      setZoom(Math.max(1, Math.min(3, baseMax.cw / nextW)));
      return;
    }

    if (!isDraggingBox) return;
    setCropOrigin(
      clampOrigin(
        startLeft + dx,
        startTop + dy,
        mediaSize.w,
        mediaSize.h,
        cw,
        ch
      )
    );
  };

  const handleBoxPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingBox || resizingCorner) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }
    setIsDraggingBox(false);
    setResizingCorner(null);
    dragBoxStartRef.current = null;
  };

  // Custom slider pointer handler
  const updateZoomFromSliderPointer = (clientX: number) => {
    if (!sliderTrackRef.current) return;
    const rect = sliderTrackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    updateZoom(1 + ratio * 2);
  };

  const handleSliderPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    updateZoomFromSliderPointer(e.clientX);
  };

  const handleSliderPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return;
    updateZoomFromSliderPointer(e.clientX);
  };

  const handleConfirm = () => {
    const availX = Math.max(0, mediaSize.w - cw);
    const availY = Math.max(0, mediaSize.h - ch);
    const normX = availX > 0.5 ? (cropOrigin.left / availX) * 100 : 50;
    const normY = availY > 0.5 ? (cropOrigin.top / availY) * 100 : 50;
    const position: MediaPosition = { x: normX, y: normY, zoom };

    // For static images, bake the exact crop box onto canvas
    if (!isAnimated && !isVideo && mediaRef.current instanceof HTMLImageElement) {
      const img = mediaRef.current;
      if (img.naturalWidth > 0 && mediaSize.w > 0 && cw > 0) {
        const scaleX = img.naturalWidth / mediaSize.w;
        const scaleY = img.naturalHeight / mediaSize.h;
        const sx = cropOrigin.left * scaleX;
        const sy = cropOrigin.top * scaleY;
        const sw = cw * scaleX;
        const sh = ch * scaleY;

        const outW = mode === "banner" ? 1600 : 512;
        const outH = mode === "banner" ? 400 : 512;
        const canvas = document.createElement("canvas");
        canvas.width = outW;
        canvas.height = outH;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
          try {
            const croppedDataUrl = canvas.toDataURL("image/jpeg", 0.92);
            onDone({ croppedDataUrl, position: { x: 50, y: 50, zoom: 1 } });
            return;
          } catch {
            // Fall back to CSS position
          }
        }
      }
    }

    onDone({ position });
  };

  const zoomPercent = ((zoom - 1) / 2) * 100;

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
          <span className="text-xs text-zinc-400">Drag the frame to position</span>
        </div>

        {/* Full-Image Stage with Draggable Blue Crop Frame (YouTube style) */}
        <div className="relative flex items-center justify-center bg-[#121212] rounded-xl py-6 px-4 overflow-hidden select-none">
          <div className="relative inline-block overflow-hidden">
            {isVideo ? (
              <video
                ref={(el) => {
                  mediaRef.current = el;
                }}
                src={previewUrl}
                autoPlay
                loop
                muted
                playsInline
                onLoadedMetadata={measureMedia}
                className="block max-h-[320px] max-w-full w-auto h-auto select-none pointer-events-none"
              />
            ) : (
              <img
                ref={(el) => {
                  mediaRef.current = el;
                }}
                src={previewUrl}
                alt="Crop preview"
                crossOrigin="anonymous"
                onLoad={measureMedia}
                draggable={false}
                className="block max-h-[320px] max-w-full w-auto h-auto select-none pointer-events-none"
              />
            )}

            {mediaSize.w > 0 && cw > 0 && (
              <div
                onPointerDown={handleBoxPointerDown}
                onPointerMove={handleBoxPointerMove}
                onPointerUp={handleBoxPointerUp}
                onPointerCancel={handleBoxPointerUp}
                style={{
                  left: `${cropOrigin.left}px`,
                  top: `${cropOrigin.top}px`,
                  width: `${cw}px`,
                  height: `${ch}px`,
                }}
                className="absolute border-2 border-[#3ea6ff] shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] cursor-move touch-none"
              >
                {/* Interactive Corner Resize Handles */}
                <span
                  onPointerDown={(e) => handleCornerPointerDown(e, "tl")}
                  onPointerMove={handleBoxPointerMove}
                  onPointerUp={handleBoxPointerUp}
                  className="absolute -top-1.5 -left-1.5 h-3 w-3 bg-white border border-black cursor-nwse-resize"
                />
                <span
                  onPointerDown={(e) => handleCornerPointerDown(e, "tr")}
                  onPointerMove={handleBoxPointerMove}
                  onPointerUp={handleBoxPointerUp}
                  className="absolute -top-1.5 -right-1.5 h-3 w-3 bg-white border border-black cursor-nesw-resize"
                />
                <span
                  onPointerDown={(e) => handleCornerPointerDown(e, "bl")}
                  onPointerMove={handleBoxPointerMove}
                  onPointerUp={handleBoxPointerUp}
                  className="absolute -bottom-1.5 -left-1.5 h-3 w-3 bg-white border border-black cursor-nesw-resize"
                />
                <span
                  onPointerDown={(e) => handleCornerPointerDown(e, "br")}
                  onPointerMove={handleBoxPointerMove}
                  onPointerUp={handleBoxPointerUp}
                  className="absolute -bottom-1.5 -right-1.5 h-3 w-3 bg-white border border-black cursor-nwse-resize"
                />
                {mode === "avatar" && (
                  <div className="pointer-events-none absolute inset-0 rounded-full border border-[#3ea6ff]/90" />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Custom Sleek Zoom Slider & Actions */}
        <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto select-none">
            <button
              type="button"
              onClick={() => updateZoom(zoom - 0.15)}
              className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Zoom out"
              aria-label="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>

            <div
              ref={sliderTrackRef}
              onPointerDown={handleSliderPointerDown}
              onPointerMove={handleSliderPointerMove}
              className="relative flex items-center w-full sm:w-44 h-6 cursor-pointer touch-none"
              role="slider"
              aria-label="Zoom"
              aria-valuemin={1}
              aria-valuemax={3}
              aria-valuenow={Number(zoom.toFixed(2))}
            >
              <div className="w-full h-[3px] rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full bg-white rounded-full"
                  style={{ width: `${zoomPercent}%` }}
                />
              </div>
              <div
                className="absolute h-3.5 w-3.5 rounded-full bg-white shadow-md -translate-x-1/2 hover:scale-110 transition-transform"
                style={{ left: `${zoomPercent}%` }}
              />
            </div>

            <button
              type="button"
              onClick={() => updateZoom(zoom + 0.15)}
              className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Zoom in"
              aria-label="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setZoom(1);
                const dims = getCropDimensions(mediaSize.w, mediaSize.h, 1);
                setCropOrigin({
                  left: (mediaSize.w - dims.cw) / 2,
                  top: (mediaSize.h - dims.ch) / 2,
                });
              }}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
              title="Reset"
              aria-label="Reset"
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
