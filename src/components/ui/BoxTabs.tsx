"use client";

import React from "react";

export interface BoxTabItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface BoxTabsProps {
  items: (string | BoxTabItem)[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
  size?: "sm" | "md";
}

export default function BoxTabs({
  items,
  activeId,
  onChange,
  className = "",
  size = "md",
}: BoxTabsProps) {
  const normalizedItems: BoxTabItem[] = items.map((item) =>
    typeof item === "string" ? { id: item, label: item } : item
  );

  const sizeClasses =
    size === "sm"
      ? "px-3 py-1.5 text-xs rounded-lg gap-1.5"
      : "px-4 py-2 text-xs sm:text-sm rounded-xl gap-2";

  return (
    <div
      className={`relative flex items-center gap-2 overflow-x-auto scrollbar-none select-none py-1 ${className}`}
    >
      {normalizedItems.map((item) => {
        const isActive = item.id === activeId;
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`flex-shrink-0 flex items-center font-medium transition-all duration-150 cursor-pointer outline-none border ${sizeClasses} ${
              isActive
                ? "bg-[#1f1f1f] border-white/20 text-white font-semibold shadow-sm"
                : "bg-[#121212] border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 hover:bg-[#181818]"
            }`}
          >
            {Icon && <Icon className="h-4 w-4" />}
            <span className="whitespace-nowrap tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
