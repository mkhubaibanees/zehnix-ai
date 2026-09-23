"use client";

import { useState, useRef, useEffect } from "react";
import { Menu, ChevronDown, Check, Share2 } from "lucide-react";
import { MODELS } from "@/lib/constants";

export default function Header({
  onOpenSidebar,
  selectedModel,
  onSelectModel,
}) {
  const [isModelOpen, setIsModelOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsModelOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeModel = MODELS.find((m) => m.id === selectedModel) ?? MODELS[0];

  return (
    <header className="flex items-center justify-between gap-3 px-3 sm:px-5 py-3 border-b border-border shrink-0">
      <div className="flex items-center gap-1 min-w-0">
        <button
          onClick={onOpenSidebar}
          className="md:hidden p-2 rounded-lg hover:bg-surface-hover text-ink-muted shrink-0"
          aria-label="Open sidebar"
        >
          <Menu size={20} />
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsModelOpen((v) => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-surface-hover transition-colors"
          >
            <span className="font-display font-semibold text-[15px] sm:text-base text-ink truncate">
              {activeModel.name}
            </span>
            <ChevronDown
              size={16}
              className={`text-ink-faint transition-transform shrink-0 ${isModelOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isModelOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-72 bg-surface-2 border border-border rounded-xl shadow-xl p-1.5 z-50 animate-fade-up">
              {MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    onSelectModel(model.id);
                    setIsModelOpen(false);
                  }}
                  className="w-full flex items-start gap-2 text-left p-2.5 rounded-lg hover:bg-surface-hover transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink">{model.name}</p>
                    <p className="text-xs text-ink-muted">{model.description}</p>
                  </div>
                  {model.id === selectedModel && (
                    <Check size={16} className="text-accent shrink-0 mt-0.5" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          className="hidden sm:flex p-2 rounded-lg hover:bg-surface-hover text-ink-muted transition-colors"
          aria-label="Share chat"
          title="Share"
        >
          <Share2 size={18} />
        </button>
      </div>
    </header>
  );
}
