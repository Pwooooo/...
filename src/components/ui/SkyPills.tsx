"use client";

import React, { useState, useEffect, useRef, useId } from "react";

export interface SkyTabItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface SkyPillsProps {
  items: (string | SkyTabItem)[];
  activeId: string;
  onChange: (id: string) => void;
  variant?: "sky" | "pill";
  fillColor?: string;
  className?: string;
}

function sliderPaths(w: number) {
  const se = 12;
  const H = Math.max(40, w);
  const de = 11;
  const ue = 34;

  return {
    box: H + 24,
    fill: `M ${se + de} 0 H ${se + H - de} Q ${se + H} 0 ${se + H} ${de} ` +
      `V 21 Q ${se + H} ${ue} ${se + H + 13} ${ue} ` +
      `H ${se - 13} Q ${se} ${ue} ${se} 21 V ${de} Q ${se} 0 ${se + de} 0 Z`,
    stroke: `M ${se - 13} ${ue} Q ${se} ${ue} ${se} 21 V ${de} Q ${se} 0 ` +
      `${se + de} 0 H ${se + H - de} Q ${se + H} 0 ${se + H} ${de} ` +
      `V 21 Q ${se + H} ${ue} ${se + H + 13} ${ue}`,
  };
}

export default function SkyPills({
  items,
  activeId,
  onChange,
  variant = "sky",
  fillColor = "#141414",
  className = "",
}: SkyPillsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [slider, setSlider] = useState<{
    left: number;
    width: number;
    box: number;
    d: string;
    ready: boolean;
  }>({
    left: 0,
    width: 0,
    box: 0,
    d: "",
    ready: false,
  });

  const normalizedItems: SkyTabItem[] = items.map((item) =>
    typeof item === "string" ? { id: item, label: item } : item
  );

  const updateSlider = () => {
    if (!containerRef.current) return;
    const activeEl = containerRef.current.querySelector(
      `[data-tab-id="${activeId}"]`
    ) as HTMLElement | null;

    if (!activeEl) return;

    const b = containerRef.current.getBoundingClientRect();
    const p = activeEl.getBoundingClientRect();
    const w = Math.max(0, p.width);

    if (variant === "sky") {
      const g = sliderPaths(w);
      setSlider({
        left: p.left - b.left - 12,
        width: g.box,
        box: g.box,
        d: g.fill,
        ready: true,
      });
    } else {
      // Rounded pill mode
      setSlider({
        left: p.left - b.left,
        width: w,
        box: w,
        d: "",
        ready: true,
      });
    }
  };

  useEffect(() => {
    updateSlider();
    const timer = setTimeout(updateSlider, 50);

    const handleResize = () => updateSlider();
    window.addEventListener("resize", handleResize);

    const observer = new ResizeObserver(() => updateSlider());
    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
    };
  }, [activeId, variant, items]);

  return (
    <div
      ref={containerRef}
      className={`sky-pills-bar relative flex items-center overflow-x-auto scrollbar-none select-none ${className}`}
      style={{ minHeight: "36px" }}
    >
      {/* Background Animated Slider */}
      {slider.ready && (
        variant === "sky" ? (
          <svg
            className="sky-tab-slider pointer-events-none absolute top-0 z-0 overflow-visible transition-all duration-200 ease-out"
            preserveAspectRatio="none"
            aria-hidden="true"
            viewBox={`0 0 ${slider.box} 34`}
            style={{
              left: `${slider.left}px`,
              width: `${slider.box}px`,
              height: "34px",
              opacity: slider.ready ? 1 : 0,
            }}
          >
            <path d={slider.d} fill={fillColor} />
          </svg>
        ) : (
          <div
            className="sky-pill-slider pointer-events-none absolute top-0.5 bottom-0.5 z-0 rounded-xl transition-all duration-200 ease-out"
            style={{
              left: `${slider.left}px`,
              width: `${slider.width}px`,
              background: fillColor,
              opacity: slider.ready ? 1 : 0,
            }}
          />
        )
      )}

      {/* Pill Elements */}
      <div className="flex items-center gap-1.5 z-10 w-full">
        {normalizedItems.map((item) => {
          const isActive = item.id === activeId;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              data-tab-id={item.id}
              data-tab-active={isActive ? "true" : "false"}
              onClick={() => onChange(item.id)}
              className={`sky-tab-pill relative flex items-center justify-center gap-2 px-4 h-[34px] rounded-[11px] text-[13px] font-medium transition-colors duration-150 cursor-pointer outline-none border-none bg-transparent ${
                isActive
                  ? "text-[#ececee] font-semibold"
                  : "text-[#96969a] hover:text-[#b6b6b9]"
              }`}
            >
              {Icon && <Icon className="h-4 w-4" />}
              <span className="whitespace-nowrap tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
