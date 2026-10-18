"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface StudioDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: (DropdownOption | string)[];
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  icon?: React.ReactNode;
  align?: "left" | "right";
}

export default function StudioDropdown({
  value,
  onChange,
  options,
  placeholder,
  className = "",
  buttonClassName = "",
  menuClassName = "",
  icon,
  align = "left",
}: StudioDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize options
  const normalizedOptions: DropdownOption[] = options.map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : opt
  );

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);
  const displayText = selectedOption?.label || placeholder || value;

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2.5 bg-[#181818] hover:bg-[#1e1e1e] border border-white/[0.08] hover:border-white/20 focus:border-white/30 rounded-xl py-2 px-3 text-xs text-zinc-200 font-medium transition-all cursor-pointer shadow-sm active:scale-[0.99] select-none ${buttonClassName}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 truncate">
          {icon && <span className="flex-shrink-0 text-zinc-400">{icon}</span>}
          {selectedOption?.icon && (
            <span className="flex-shrink-0">{selectedOption.icon}</span>
          )}
          <span className="truncate">{displayText}</span>
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 text-zinc-400 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-white" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu matching Image 2 sleek styling */}
      {isOpen && (
        <div
          role="listbox"
          className={`absolute ${
            align === "right" ? "right-0" : "left-0"
          } mt-1.5 min-w-full w-max max-w-xs z-50 rounded-2xl bg-[#212121] border border-white/[0.12] p-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 select-none max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 ${menuClassName}`}
        >
          {normalizedOptions.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer text-left ${
                  isSelected
                    ? "bg-white/[0.1] text-white font-semibold"
                    : "text-zinc-300 hover:bg-[#272727] hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {opt.icon && (
                    <span className="flex-shrink-0">{opt.icon}</span>
                  )}
                  <span className="truncate">{opt.label}</span>
                </div>
                {isSelected && (
                  <Check className="h-3.5 w-3.5 text-white flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
