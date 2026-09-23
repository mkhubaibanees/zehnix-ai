"use client";

import { SUGGESTED_PROMPTS, APP_NAME } from "@/lib/constants";

export default function WelcomeScreen({ onSelectPrompt }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 animate-fade-in">
      <div className="ai-orb w-14 h-14 rounded-full mb-5" aria-hidden="true" />
      <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink text-center">
        What can I help with?
      </h1>
      <p className="text-ink-muted text-sm sm:text-[15px] mt-2 text-center max-w-md">
        Ask {APP_NAME} anything, or start from one of these.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-8 w-full max-w-xl">
        {SUGGESTED_PROMPTS.map(({ icon: Icon, title, subtitle, prompt }) => (
          <button
            key={title}
            onClick={() => onSelectPrompt(prompt)}
            className="flex items-start gap-3 text-left p-3.5 rounded-2xl border border-border bg-surface-1 hover:bg-surface-hover hover:border-accent/40 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-accent-soft text-accent flex items-center justify-center shrink-0">
              <Icon size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">{title}</p>
              <p className="text-xs text-ink-muted truncate">{subtitle}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
