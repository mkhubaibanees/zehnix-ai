"use client";

import { useState, useRef, useEffect } from "react";
import { Copy, Check, Edit2, RefreshCw, Sparkles, FileText, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
  
const CodeBlock = ({ language, value }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="my-5 flex flex-col rounded-[24px] overflow-hidden bg-[#131314] dark:bg-[#131314] border border-black/10 dark:border-white/10 shadow-md w-full">

      {/* Header with adjusted colors, bolder language text, and Icon-only button */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-[#1e1f20] dark:bg-[#1e1f20] text-gray-300">
        <span className="text-[13px] font-semibold capitalize tracking-wide font-sans">{language || "text"}</span>
        <button
          onClick={handleCopy}
          title={isCopied ? "Copied!" : "Copy code"}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center"
        >
          {isCopied ? (
            <Check size={18} strokeWidth={2.5} className="text-emerald-400" />
          ) : (
            <Copy size={18} strokeWidth={2.5} />
          )}
        </button>
      </div>

      {/* Bolder, Larger Font for the actual code */}
      <div className="w-full text-[14.5px] font-medium tracking-[0.01em] overflow-x-auto p-4 sm:p-5">
        <SyntaxHighlighter
          language={language?.toLowerCase() || "text"}
          style={oneDark}
          customStyle={{
            margin: 0,
            padding: 0,
            backgroundColor: 'transparent',
          }}
          codeTagProps={{
            style: {
              backgroundColor: 'transparent',
              fontFamily: 'inherit',
            }
          }}
        >
          {value}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export default function ChatMessage({ message, isDarkMode, onRegenerate, onEdit }) {
  const isUser = message.role === "user";

  const displayContent = message.content.split("\n\n--- ATTACHED FILES ---")[0];

  const [isCopied, setIsCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(displayContent);
  const [editAttachments, setEditAttachments] = useState(message.attachments || []);
  const textareaRef = useRef(null);

  // Automatically adjust textarea height
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [editValue, isEditing, editAttachments]);

  // Reset state if user cancels
  useEffect(() => {
    if (!isEditing) {
      setEditValue(displayContent);
      setEditAttachments(message.attachments || []);
    }
  }, [isEditing, displayContent, message.attachments]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const removeEditAttachment = (indexToRemove) => {
    setEditAttachments((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  // Has the text OR the files changed?
  const hasChanged =
    (editValue.trim() !== displayContent.trim() && editValue.trim() !== "") ||
    editAttachments.length !== (message.attachments || []).length;

  const handleSaveEdit = () => {
    if (hasChanged) {
      let newHiddenText = "";

      if (message.content.includes("\n\n--- ATTACHED FILES ---\n")) {
        const parts = message.content.split("\n\n--- ATTACHED FILES ---\n");
        let hiddenPart = parts[1];

        const originalAttachments = message.attachments || [];
        const removedFiles = originalAttachments.filter(
          (oldFile) => !editAttachments.find((newFile) => newFile.name === oldFile.name)
        );

        removedFiles.forEach((file) => {
          // Regex to safely find and remove the specific file's code block from the hidden text
          const safeName = file.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`\\nFile Name: ${safeName}\\n\\\`\\\`\\\`\\n[\\s\\S]*?\\n\\\`\\\`\\\`\\n`, 'g');
          hiddenPart = hiddenPart.replace(regex, '');
        });

        if (hiddenPart.trim() !== "") {
          newHiddenText = "\n\n--- ATTACHED FILES ---\n" + hiddenPart;
        }
      }

      onEdit(message.id, editValue + newHiddenText, editAttachments);
    }
    setIsEditing(false);
  };

  return (
    <div className="group w-full px-2 sm:px-4 py-3 flex justify-center">

      <div className={`flex w-full max-w-3xl ${isUser ? "justify-end" : "justify-start"}`}>

        {/* AI Sparkle Icon */}
        {!isUser && (
          <div className="shrink-0 w-8 h-8 mr-4 mt-1 flex items-center justify-center rounded-full">
            <Sparkles size={22} className="text-[#a8c7fa]" />
          </div>
        )}

        {/* Removed max-w-[90%] so the user bubble can expand to the full max-w-3xl container width */}
        <div className={`flex flex-col gap-2 w-full ${isUser ? "items-end" : "items-start"}`}>

          {isEditing ? (
            <div className="w-full min-w-[280px] sm:min-w-[450px] flex flex-col items-end animate-fade-in">
              <div className="w-full flex flex-col border border-[#4a90e2] bg-transparent rounded-[24px] overflow-hidden transition-all shadow-sm">

                {/* Files rendered INSIDE the edit box at the top */}
                {editAttachments && editAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 px-5 pt-4 pb-2 border-b border-border/50 bg-black/5 dark:bg-white/5">
                    {editAttachments.map((file, i) => (
                      <div key={i} className="group/file relative flex items-center gap-2 bg-white dark:bg-[#282a2c] border border-border px-3 py-1.5 rounded-xl shadow-sm">
                        <FileText size={14} className="text-blue-500 shrink-0" />
                        <span className="text-xs font-medium text-ink truncate max-w-[120px]">{file.name}</span>
                        <button
                          onClick={() => removeEditAttachment(i)}
                          className="absolute -top-1.5 -right-1.5 p-1 bg-surface border border-border rounded-full text-ink-muted hover:text-danger hover:bg-surface-hover transition-colors opacity-0 group-hover/file:opacity-100"
                          title="Remove file"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <textarea
                  ref={textareaRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full bg-transparent px-5 py-4 !border-0 !outline-none !ring-0 focus:!border-0 focus:!ring-0 focus:!outline-none !shadow-none text-[15.5px] leading-relaxed resize-none overflow-hidden text-[#1f1f1f] dark:text-[#e3e3e3]"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-2 text-sm font-medium rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={!hasChanged}
                  className={`px-6 py-2 text-sm font-medium rounded-full transition-colors shadow-sm ${hasChanged
                    ? "bg-[#1a73e8] text-white hover:bg-[#1557b0]"
                    : "bg-[#1a73e8]/40 text-white/50 cursor-not-allowed"
                    }`}
                >
                  Update
                </button>
              </div>
            </div>
          ) : (
            // --- NORMAL MESSAGE MODE ---
            // Added max-w-full to prevent bubble from exceeding parent layout limits
            <div className={`relative flex flex-col max-w-full ${isUser
              ? "bg-[#f0f4f9] dark:bg-[#282a2c] px-5 py-4 rounded-[28px] text-[#1f1f1f] dark:text-[#e3e3e3]"
              : "py-1 text-[#1f1f1f] dark:text-[#e3e3e3]"
              }`}>

              {/* Files ABOVE text */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {message.attachments.map((file, i) => (
                    <div key={i} className={`flex items-center gap-3 border px-3.5 py-2 rounded-2xl ${isUser ? "bg-white/60 dark:bg-black/20 border-black/5 dark:border-white/10" : "bg-surface-2 border-border"}`}>
                      <div className="p-2 bg-blue-500/10 dark:bg-blue-500/20 rounded-lg">
                        <FileText size={16} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex flex-col pr-2">
                        <span className="text-sm font-semibold line-clamp-1 max-w-[150px]">{file.name}</span>
                        <span className="text-[11px] opacity-60">{(file.size / 1024).toFixed(1)} KB</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Replaced raw displayContent with ReactMarkdown to render code blocks */}
              <div className="text-[16px] font-medium text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap break-words md-content w-full max-w-full overflow-hidden">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code(props) {
                      const { children, className, node, ...rest } = props;
                      // Detect if it is a multi-line code block with a language specified
                      const match = /language-(\w+)/.exec(className || "");
                      if (match) {
                        return <CodeBlock language={match[1]} value={String(children).replace(/\n$/, "")} />;
                      }
                      // Regular inline code (e.g., inside paragraphs)
                      return (
                        <code {...rest} className={className}>
                          {children}
                        </code>
                      );
                    }
                  }}
                >
                  {displayContent}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!isEditing && (
            <div className={`flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity mt-1 ${isUser ? "pr-3" : "pl-1"}`}>
              <button onClick={handleCopy} className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors" title="Copy">
                {isCopied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
              </button>
              {isUser && (
                <button onClick={() => setIsEditing(true)} className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors" title="Edit">
                  <Edit2 size={16} />
                </button>
              )}
              {!isUser && message.status === "done" && (
                <button onClick={() => onRegenerate(message.id)} className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors" title="Regenerate">
                  <RefreshCw size={16} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

}

