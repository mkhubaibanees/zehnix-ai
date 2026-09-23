"use client";

import { useState, useEffect, useRef } from "react";
import {
    X,
    Sun,
    Moon,
    Monitor,
    SlidersHorizontal,
    Database,
    Trash2,
    Download,
    ChevronDown,
} from "lucide-react";
import { APP_NAME } from "@/lib/constants";

const TABS = [
    { id: "general", label: "General", icon: SlidersHorizontal },
    { id: "personalization", label: "Personalization", icon: Monitor },
    { id: "data", label: "Data controls", icon: Database },
];

const THEME_OPTIONS = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
    { id: "system", label: "System", icon: Monitor },
];

const LANGUAGES = ["English", "اردو (Urdu)", "العربية", "Español", "Français"];

function Toggle({ checked, onChange }) {
    return (
        <button
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${checked ? "bg-accent" : "bg-surface-hover"
                }`}
        >
            <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0"
                    }`}
            />
        </button>
    );
}

function Row({ title, description, children }) {
    return (
        <div className="flex items-center justify-between gap-4 py-3.5 border-b border-border last:border-b-0">
            <div className="min-w-0">
                <p className="text-sm text-ink font-medium">{title}</p>
                {description && (
                    <p className="text-xs text-ink-muted mt-0.5">{description}</p>
                )}
            </div>
            {children}
        </div>
    );
}

export default function SettingsModal({
    isOpen,
    onClose,
    themeMode,
    onChangeTheme,
}) {
    const [activeTab, setActiveTab] = useState("general");
    const [language, setLanguage] = useState("English");
    const [isLangOpen, setIsLangOpen] = useState(false);
    const [suggestPrompts, setSuggestPrompts] = useState(true);
    const [showTimestamps, setShowTimestamps] = useState(false);
    const [codeLineNumbers, setCodeLineNumbers] = useState(true);
    const modalRef = useRef(null);

    useEffect(() => {
        function handleKeyDown(e) {
            if (e.key === "Escape") onClose();
        }
        if (isOpen) document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    // Handle actual theme switching logic and save preference to localStorage
    const handleThemeSelection = (selectedTheme) => {
        // Update the parent state so the UI button reflects the active state
        onChangeTheme(selectedTheme);

        // Apply the theme classes and save to localStorage
        if (selectedTheme === "dark") {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else if (selectedTheme === "light") {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        } else {
            // For system preference, remove the manual override and check OS settings
            localStorage.removeItem("theme");
            if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
                document.documentElement.classList.add("dark");
            } else {
                document.documentElement.classList.remove("dark");
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 animate-fade-in"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                ref={modalRef}
                className="w-full max-w-2xl h-[min(600px,85vh)] bg-surface rounded-2xl border border-border shadow-2xl flex overflow-hidden animate-fade-up"
            >
                {/* Tab rail */}
                <div className="w-44 sm:w-52 shrink-0 bg-surface-1 border-r border-border p-3 flex flex-col">
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint px-2 mb-2">
                        Settings
                    </p>
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm mb-1 text-left transition-colors ${active
                                        ? "bg-accent-soft text-accent font-medium"
                                        : "text-ink-muted hover:bg-surface-hover hover:text-ink"
                                    }`}
                            >
                                <Icon size={16} />
                                <span className="truncate">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                        <h2 className="font-display font-semibold text-ink">
                            {TABS.find((t) => t.id === activeTab)?.label}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg hover:bg-surface-hover text-ink-faint hover:text-ink transition-colors"
                            aria-label="Close settings"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-5 py-2">
                        {activeTab === "general" && (
                            <div>
                                <div className="py-3.5 border-b border-border">
                                    <p className="text-sm text-ink font-medium mb-2.5">Theme</p>
                                    <div className="flex gap-2">
                                        {THEME_OPTIONS.map((opt) => {
                                            const Icon = opt.icon;
                                            const active = themeMode === opt.id;
                                            return (
                                                <button
                                                    key={opt.id}
                                                    // Updated to use the new local handler
                                                    onClick={() => handleThemeSelection(opt.id)}
                                                    className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-colors ${active
                                                            ? "border-accent bg-accent-soft text-accent"
                                                            : "border-border text-ink-muted hover:bg-surface-hover hover:text-ink"
                                                        }`}
                                                >
                                                    <Icon size={17} />
                                                    <span className="text-xs font-medium">{opt.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <Row
                                    title="Language"
                                    description={`How ${APP_NAME} labels menus and buttons`}
                                >
                                    <div className="relative">
                                        <button
                                            onClick={() => setIsLangOpen((v) => !v)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm text-ink hover:bg-surface-hover transition-colors"
                                        >
                                            {language}
                                            <ChevronDown size={14} className="text-ink-faint" />
                                        </button>
                                        {isLangOpen && (
                                            <div className="absolute right-0 top-full mt-1.5 w-44 bg-surface-2 border border-border rounded-xl shadow-xl p-1.5 z-10 animate-fade-up">
                                                {LANGUAGES.map((lang) => (
                                                    <button
                                                        key={lang}
                                                        onClick={() => {
                                                            setLanguage(lang);
                                                            setIsLangOpen(false);
                                                        }}
                                                        className={`w-full text-left text-sm px-2.5 py-2 rounded-lg transition-colors ${lang === language
                                                                ? "text-accent bg-accent-soft"
                                                                : "text-ink hover:bg-surface-hover"
                                                            }`}
                                                    >
                                                        {lang}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </Row>
                            </div>
                        )}

                        {activeTab === "personalization" && (
                            <div>
                                <Row
                                    title="Suggested prompts"
                                    description="Show starter prompt cards on a new chat"
                                >
                                    <Toggle checked={suggestPrompts} onChange={setSuggestPrompts} />
                                </Row>
                                <Row
                                    title="Message timestamps"
                                    description="Show the time under each message"
                                >
                                    <Toggle checked={showTimestamps} onChange={setShowTimestamps} />
                                </Row>
                                <Row
                                    title="Code line numbers"
                                    description="Show line numbers in code blocks"
                                >
                                    <Toggle checked={codeLineNumbers} onChange={setCodeLineNumbers} />
                                </Row>
                            </div>
                        )}

                        {activeTab === "data" && (
                            <div>
                                <Row
                                    title="Export conversations"
                                    description="Download all your chats as a file"
                                >
                                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm text-ink hover:bg-surface-hover transition-colors">
                                        <Download size={14} />
                                        Export
                                    </button>
                                </Row>
                                <Row
                                    title="Clear all conversations"
                                    description="Permanently delete every chat in this browser"
                                >
                                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-danger/30 text-sm text-danger hover:bg-danger-soft transition-colors">
                                        <Trash2 size={14} />
                                        Clear
                                    </button>
                                </Row>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}