"use client";

import { useRef, useState, useEffect } from "react";
// Added ChevronDown and Check for the model dropdown
import { Plus, ArrowUp, Square, FileText, Table, X, Clock, FileCode2, Paperclip, Image as ImageIcon, ChevronDown, Check } from "lucide-react";
// Added MODELS from constants
import { APP_NAME, MODELS } from "@/lib/constants";

export default function ChatInput({
  value,
  onChange,
  onSend,
  onStop,
  isGenerating,
  requestCount,
  limit,
  cooldownTime,
  selectedModel, // NEW
  onSelectModel  // NEW
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false); // NEW
  const [attachments, setAttachments] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);
  const modelMenuRef = useRef(null); // NEW

  const isRateLimited = requestCount >= limit;
  const ACCEPTED_TYPES = ".php,.js,.jsx,.ts,.tsx,.py,.html,.css,.json,.txt,.md,.csv,.xlsx,.xls,.doc,.docx,.pdf,image/*";

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [value, attachments]);

  // Handle clicking outside of both menus
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setIsMenuOpen(false);
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target)) setIsModelMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const canSend = (value.trim().length > 0 || attachments.length > 0) && !isRateLimited;

  const handleSend = () => {
    if (!canSend || isGenerating || isRateLimited) return;
    onSend(attachments);
    setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFilePick = () => {
    setIsMenuOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.accept = ACCEPTED_TYPES;
      fileInputRef.current.click();
    }
  };

  const processFiles = (files) => {
    const MAX_FILE_SIZE = 1 * 1024 * 1024;
    const validFiles = [];

    files.forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        alert(`File "${file.name}" is too large (${(file.size / (1024 * 1024)).toFixed(2)} MB).\n\nTo prevent exceeding the AI's reading capacity (token limit), please keep individual files under 1MB.`);
      } else {
        validFiles.push(file);
      }
    });

    setAttachments((prev) => [...prev, ...validFiles]);
  };

  const handleFileChange = (e) => {
    processFiles(Array.from(e.target.files || []));
    e.target.value = "";
  };

  const handleDragOver = (e) => { e.preventDefault(); if (!isRateLimited) setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (isRateLimited) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (filename) => {
    if (filename.match(/\.(php|js|jsx|ts|tsx|py|html|css|json)$/i)) return <FileCode2 size={18} className="text-blue-500" />;
    if (filename.match(/\.(csv|xlsx|xls)$/i)) return <Table size={18} className="text-emerald-500" />;
    if (filename.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return <ImageIcon size={18} className="text-purple-500" />;
    return <FileText size={18} className="text-gray-500 dark:text-gray-400" />;
  };

  return (
    <div className="p-3 sm:p-4 w-full shrink-0">
      <div className="max-w-3xl mx-auto relative">
        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />

        {isMenuOpen && (
          <div ref={menuRef} className="absolute bottom-full mb-3 left-0 border border-border rounded-2xl p-1.5 w-48 shadow-2xl z-50 bg-surface-2 animate-fade-up">
            <button onClick={handleFilePick} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-hover transition-colors text-sm text-ink font-medium">
              <Paperclip size={17} className="text-ink-muted" />
              Upload files
            </button>
          </div>
        )}

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex flex-col rounded-3xl border transition-all shadow-sm ${isRateLimited
            ? "border-danger/40 bg-surface-2"
            : isDragging
              ? "border-accent bg-accent/5 scale-[1.01]"
              : "border-border bg-surface-1 focus-within:border-accent"
            }`}
        >
          {isDragging && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/80 backdrop-blur-sm rounded-3xl pointer-events-none">
              <p className="font-semibold text-accent flex items-center gap-2">
                <Paperclip size={18} /> Drop files here
              </p>
            </div>
          )}

          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-3 px-4 pt-4 pb-1">
              {attachments.map((file, i) => (
                <div key={i} className="group relative flex items-center gap-3 bg-white dark:bg-[#1e1f20] border border-border px-3 py-2.5 rounded-xl min-w-[140px] max-w-[220px] shadow-sm animate-fade-in">
                  <div className="p-2 bg-surface-2 rounded-lg shrink-0">{getFileIcon(file.name)}</div>
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="text-xs font-semibold text-ink truncate">{file.name}</span>
                    <span className="text-[10px] text-ink-muted">{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                  <button onClick={() => removeAttachment(i)} className="absolute -top-2 -right-2 p-1 bg-surface border border-border rounded-full text-ink-muted hover:text-danger hover:bg-surface-hover transition-colors shadow-sm opacity-0 group-hover:opacity-100" title="Remove file">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end px-2 py-2">
            <button onClick={() => setIsMenuOpen((v) => !v)} disabled={isRateLimited} className={`p-2.5 rounded-full transition-colors shrink-0 mb-0.5 ${isRateLimited ? "text-ink-faint opacity-50 cursor-not-allowed" : isMenuOpen ? "bg-surface-hover text-ink" : "text-ink-faint hover:text-ink hover:bg-surface-hover"}`}>
              <Plus size={22} />
            </button>

            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isRateLimited}
              placeholder={isRateLimited ? `Rate limit reached. Please wait ${cooldownTime}s...` : `Ask ${APP_NAME} a question...`}
              rows={1}
              className={`flex-1 bg-transparent !border-0 !outline-none !ring-0 focus:!border-0 focus:!ring-0 focus:!outline-none !shadow-none px-2.5 py-2.5 text-[15.5px] resize-none max-h-48 ${isRateLimited ? "text-danger placeholder-danger/60 cursor-not-allowed" : "text-[#1f1f1f] dark:text-[#e3e3e3] placeholder-gray-500"}`}
            />

            {/* --- NEW: Gemini Style Model Selector inside Input --- */}
            <div className="relative mb-1 mr-1 shrink-0" ref={modelMenuRef}>
              <button
                onClick={() => setIsModelMenuOpen((v) => !v)}
                disabled={isRateLimited || isGenerating}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13.5px] font-medium text-gray-500 hover:bg-surface-hover hover:text-ink transition-colors disabled:opacity-50"
              >
                {MODELS.find(m => m.id === selectedModel)?.name.replace("Gemini 3.5 ", "") || "Model"}
                <ChevronDown size={14} className="text-ink-faint" />
              </button>

              {isModelMenuOpen && (
                <div className="absolute bottom-full right-0 mb-3 w-64 bg-surface-2 border border-border rounded-2xl shadow-xl py-1.5 z-50 animate-fade-up">
                  {MODELS.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        onSelectModel(model.id);
                        setIsModelMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-hover transition-colors text-left"
                    >
                      <div className="pr-3">
                        <p className={`text-[13.5px] font-medium ${selectedModel === model.id ? "text-accent" : "text-ink"}`}>
                          {model.name}
                        </p>
                        <p className="text-[11.5px] text-gray-500 mt-0.5 leading-tight">{model.description}</p>
                      </div>
                      {selectedModel === model.id && <Check size={16} className="text-accent shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isGenerating ? (
              <button onClick={onStop} className="p-2.5 rounded-full shrink-0 mb-0.5 bg-ink text-surface hover:opacity-85 transition-opacity flex items-center justify-center">
                <Square size={16} fill="currentColor" />
              </button>
            ) : (
              <button onClick={handleSend} disabled={!canSend} className={`p-2.5 rounded-full shrink-0 mb-0.5 transition-all flex items-center justify-center ${canSend ? "bg-[#1a73e8] text-white hover:bg-[#1557b0] shadow-sm" : "text-ink-faint bg-transparent"}`}>
                <ArrowUp size={19} />
              </button>
            )}
          </div>
        </div>

        {/* Footer Area with Dynamic Rate Limit Tracker */}
        <div className="flex items-center justify-between mt-2.5 px-2">
          <p className="text-xs text-ink-faint">
            Developed and maintained by Khubaib Anees.
          </p>

          <div className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-medium transition-all ${isRateLimited ? "bg-danger-soft text-danger border border-danger/20 animate-pulse-soft" : requestCount > 0 ? "bg-surface-2 text-ink-muted border border-border" : "opacity-0 pointer-events-none"}`}>
            {isRateLimited ? (
              <>
                <Clock size={12} className="shrink-0" />
                <span>Wait {cooldownTime}s</span>
              </>
            ) : (
              <span>{requestCount} / {limit} per minute</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}