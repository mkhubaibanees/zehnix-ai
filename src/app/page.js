"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowDown, Loader2 } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import WelcomeScreen from "@/components/WelcomeScreen";
import SettingsModal from "@/components/SettingsModal";
import { getMockReply, MODELS } from "@/lib/constants";
import { saveNewChat, updateChat, getChatById } from "@/lib/actions";
import { APP_NAME } from "@/lib/constants";

let idCounter = 0;
const nextId = () => `msg-${Date.now()}-${idCounter++}`;

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [themeMode, setThemeMode] = useState("system");
  const [systemPrefersDark, setSystemPrefersDark] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);
  const [sidebarTrigger, setSidebarTrigger] = useState(0);
  const [isLoadingChat, setIsLoadingChat] = useState(true);

  const [requestCount, setRequestCount] = useState(0);
  const [cooldownTime, setCooldownTime] = useState(0);

  const currentLimit = selectedModel.includes("lite") ? 15 : 5;

  const scrollRef = useRef(null);

  // Sync React state with localStorage on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setThemeMode(savedTheme);
    }
  }, []);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemPrefersDark(mql.matches);
    const handler = (e) => setSystemPrefersDark(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    let timer;
    if (cooldownTime > 0) {
      timer = setInterval(() => {
        setCooldownTime((prev) => prev - 1);
      }, 1000);
    } else if (cooldownTime === 0 && requestCount > 0) {
      setRequestCount(0);
    }
    return () => clearInterval(timer);
  }, [cooldownTime, requestCount]);

  const scrollToBottom = useCallback((behavior = "smooth") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  useEffect(() => {
    scrollToBottom("auto");
  }, [messages.length]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollButton(distanceFromBottom > 200);
  };

  const streamAssistantReply = async (userText, currentMessagesHistory, currentChatId, userAttachments = []) => {
    const replyId = nextId();
    setMessages((prev) => [
      ...prev,
      { id: replyId, role: "assistant", content: "", status: "streaming" },
    ]);
    setIsGenerating(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...currentMessagesHistory, { role: "user", content: userText }],
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to fetch response");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;
      let fullText = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
          setMessages((prev) =>
            prev.map((m) => (m.id === replyId ? { ...m, content: fullText } : m))
          );
          scrollToBottom("auto");
        }
      }

      setMessages((prev) =>
        prev.map((m) => (m.id === replyId ? { ...m, status: "done" } : m))
      );

      const finalDbMessages = [
        ...currentMessagesHistory,
        { role: "user", content: userText, attachments: userAttachments },
        { role: "assistant", content: fullText }
      ].map(msg => ({ role: msg.role, content: msg.content, attachments: msg.attachments || [] }));

      if (!currentChatId) {
        const title = userText.length > 35 ? userText.substring(0, 35) + "..." : userText;
        const savedChat = await saveNewChat(title, finalDbMessages);
        if (savedChat) {
          setActiveChatId(savedChat._id);
          setSidebarTrigger((prev) => prev + 1);
        }
      } else {
        await updateChat(currentChatId, finalDbMessages);
      }
    } catch (error) {
      console.error("Chat Error:", error);
      let errorMessage = "⚠️ Sorry, I encountered an error.";

      if (error.message.includes("429") || error.message.includes("Quota exceeded") || error.message.includes("token_count")) {
        errorMessage = "⚠️ You exceeded the AI's token limit. The attached files contain too much text to process at once. Please remove some files and try again.";
      } else if (error.message.includes("503") || error.message.includes("high demand")) {
        errorMessage = "⚠️ Google's AI servers are currently experiencing high demand. Please wait a few seconds and try again.";
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === replyId ? { ...m, content: errorMessage, status: "done" } : m
        )
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = async (attachments = []) => {
    const text = input.trim();
    if (!text && attachments.length === 0) return;

    if (requestCount >= currentLimit) return;

    if (requestCount === 0) setCooldownTime(60);
    setRequestCount((prev) => prev + 1);

    setInput("");
    let finalPrompt = text;

    if (attachments.length > 0) {
      finalPrompt += "\n\n--- ATTACHED FILES ---\n";
      for (const file of attachments) {
        try {
          const fileContent = await file.text();
          finalPrompt += `\nFile Name: ${file.name}\n\`\`\`\n${fileContent}\n\`\`\`\n`;
        } catch (error) {
          console.error("Could not read file:", file.name);
          finalPrompt += `\nFile Name: ${file.name} (Error reading content)\n`;
        }
      }
    }

    const mappedAttachments = attachments.map(a => ({ name: a.name, size: a.size }));
    const newUserMsg = {
      id: nextId(),
      role: "user",
      content: finalPrompt,
      attachments: mappedAttachments
    };

    setMessages((prev) => [...prev, newUserMsg]);
    streamAssistantReply(finalPrompt, messages, activeChatId);
  };

  const handleStop = () => {
    setIsGenerating(false);
    setMessages((prev) =>
      prev.map((m) => (m.status === "streaming" ? { ...m, status: "done" } : m))
    );
  };

  const handleRegenerate = (messageId) => {
    if (requestCount >= currentLimit) return;

    const index = messages.findIndex((m) => m.id === messageId);
    const priorUserMessage = [...messages.slice(0, index)]
      .reverse()
      .find((m) => m.role === "user");
    if (!priorUserMessage) return;

    if (requestCount === 0) setCooldownTime(60);
    setRequestCount((prev) => prev + 1);

    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    streamAssistantReply(priorUserMessage.content, messages.slice(0, index), activeChatId, priorUserMessage.attachments || []);
  };

  const handleEdit = (messageId, newContent, newAttachments) => {
    if (requestCount >= currentLimit) return;
    const index = messages.findIndex((m) => m.id === messageId);
    if (index === -1) return;

    if (requestCount === 0) setCooldownTime(60);
    setRequestCount((prev) => prev + 1);

    const priorMessages = messages.slice(0, index);
    const oldMsg = messages[index];
    const finalAttachments = newAttachments !== undefined ? newAttachments : (oldMsg.attachments || []);

    const updatedUserMsg = {
      id: messageId,
      role: "user",
      content: newContent,
      attachments: finalAttachments
    };

    setMessages([...priorMessages, updatedUserMsg]);
    streamAssistantReply(newContent, priorMessages, activeChatId, finalAttachments);
  };

  const handleSelectPrompt = (prompt) => setInput(prompt);

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
    setIsGenerating(false);
    setActiveChatId(null);
    setIsSidebarOpen(false);
    setIsLoadingChat(false);

    window.history.replaceState(null, "", window.location.pathname);
  };

  const handleSelectChat = async (id) => {
    setActiveChatId(id);
    setIsLoadingChat(true);
    setIsSidebarOpen(false);

    try {
      const chatData = await getChatById(id);
      if (chatData && chatData.messages) {
        setMessages(chatData.messages.map(m => ({ ...m, id: `msg-${m._id || Date.now()}-${Math.random()}` })));
      }
    } catch (error) {
      console.error("Failed to load chat", error);
    } finally {
      setIsLoadingChat(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlChatId = params.get("chat");

    if (urlChatId && messages.length === 0) {
      handleSelectChat(urlChatId);
    } else {
      setIsLoadingChat(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeChatId) {
      window.history.replaceState(null, "", `?chat=${activeChatId}`);
    }
  }, [activeChatId]);

  const hasUrlChat = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("chat") : null;
  const shouldShowSpinner = isLoadingChat || (hasUrlChat && messages.length === 0);

  return (
    <div>
      <div className="flex h-screen font-sans bg-surface text-ink transition-colors duration-300">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onNewChat={handleNewChat}
          activeChatId={activeChatId}
          onSelectChat={handleSelectChat}
          refreshTrigger={sidebarTrigger}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((v) => !v)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onChatDeleted={(deletedId) => {
            if (activeChatId === deletedId) {
              handleNewChat();
            }
          }}
        />

        <div className="flex-1 flex flex-col min-w-0 relative">
          <div className="md:hidden flex items-center p-3 border-b border-border bg-surface shrink-0">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-surface-hover text-ink-muted"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
            </button>
            <span className="font-display font-semibold text-ink ml-2 tracking-tight">{APP_NAME}</span>
          </div>

          {shouldShowSpinner ? (
            <div className="flex-1 flex flex-col items-center justify-center animate-fade-in">
              <Loader2 size={32} className="animate-spin text-accent" />
            </div>
          ) : messages.length === 0 ? (
            <WelcomeScreen onSelectPrompt={handleSelectPrompt} />
          ) : (
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-6 scroll-smooth"
            >
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isDarkMode={themeMode === "dark" || (themeMode === "system" && systemPrefersDark)}
                  onRegenerate={handleRegenerate}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          )}

          {showScrollButton && messages.length > 0 && (
            <button
              onClick={() => scrollToBottom()}
              className="absolute bottom-32 left-1/2 -translate-x-1/2 p-2 rounded-full bg-surface-2 border border-border shadow-lg text-ink-muted hover:text-ink transition-colors animate-fade-in z-10"
            >
              <ArrowDown size={16} />
            </button>
          )}

          <ChatInput
            value={input}
            onChange={setInput}
            onSend={handleSend}
            onStop={handleStop}
            isGenerating={isGenerating}
            requestCount={requestCount}
            limit={currentLimit}
            cooldownTime={cooldownTime}
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
          />
        </div>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        themeMode={themeMode}
        onChangeTheme={setThemeMode}
      />
    </div>
  );
}