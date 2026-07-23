"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, MapPin, Package, X } from "lucide-react";

export interface SearchSuggestion {
  id: string;
  label: string;         // Primary text (food name)
  sublabel?: string;     // Secondary text (category / location)
  type: "food" | "location" | "category" | "donor";
  icon?: "food" | "location";
}

interface SearchAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: SearchSuggestion[];
  onSelect: (suggestion: SearchSuggestion) => void;
  placeholder?: string;
  className?: string;
}

export function SearchAutocomplete({
  value,
  onChange,
  suggestions,
  onSelect,
  placeholder = "Cari makanan, lokasi, atau donor...",
  className = "",
}: SearchAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Compute filtered suggestions from raw list
  const filtered = value.trim().length >= 1
    ? suggestions.filter((s) =>
        s.label.toLowerCase().includes(value.toLowerCase()) ||
        (s.sublabel ?? "").toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8)
    : [];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setOpen(true);
    setActiveIndex(-1);
  };

  const handleSelect = useCallback(
    (s: SearchSuggestion) => {
      onChange(s.label);
      setOpen(false);
      setActiveIndex(-1);
      onSelect(s);
    },
    [onChange, onSelect]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || filtered.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < filtered.length) {
        handleSelect(filtered[activeIndex]);
      } else {
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  const handleClear = () => {
    onChange("");
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input */}
      <div className="relative flex items-center">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA39C] pointer-events-none"
          size={14}
        />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => value.trim().length >= 1 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full h-10 pl-9 pr-8 rounded-[8px] border border-[#9AA39C] bg-white text-xs text-[#1B1F1C] focus:outline-none focus:border-[#2F6E4F] placeholder:text-[#9AA39C] transition-colors"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9AA39C] hover:text-[#5B655D] transition-colors"
            aria-label="Hapus pencarian"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && filtered.length > 0 && (
        <div
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E4F0E8] rounded-[10px] shadow-lg z-[9999] overflow-hidden"
          role="listbox"
          aria-label="Saran pencarian"
        >
          <ul className="py-1 max-h-64 overflow-y-auto">
            {filtered.map((s, idx) => (
              <li
                key={s.id}
                role="option"
                aria-selected={idx === activeIndex}
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent blur
                  handleSelect(s);
                }}
                onMouseEnter={() => setActiveIndex(idx)}
                className={[
                  "flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors text-xs",
                  idx === activeIndex
                    ? "bg-[#E4F0E8] text-[#2F6E4F]"
                    : "text-[#1B1F1C] hover:bg-[#F4F6F3]",
                ].join(" ")}
              >
                {/* Icon */}
                <span
                  className={[
                    "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center",
                    idx === activeIndex ? "bg-[#2F6E4F]/10" : "bg-[#F4F6F3]",
                  ].join(" ")}
                >
                  {s.icon === "location" || s.type === "location" ? (
                    <MapPin size={11} className={idx === activeIndex ? "text-[#2F6E4F]" : "text-[#9AA39C]"} />
                  ) : (
                    <Package size={11} className={idx === activeIndex ? "text-[#2F6E4F]" : "text-[#9AA39C]"} />
                  )}
                </span>

                {/* Text */}
                <span className="flex-1 min-w-0">
                  <span className="font-medium block truncate">{s.label}</span>
                  {s.sublabel && (
                    <span className={[
                      "block truncate mt-0.5",
                      idx === activeIndex ? "text-[#2F6E4F]/70" : "text-[#9AA39C]",
                    ].join(" ")}>
                      {s.sublabel}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
