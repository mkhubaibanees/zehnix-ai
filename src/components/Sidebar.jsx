"use client";

import { useState, useEffect } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import {
    Plus, Search, MessageSquare, PanelLeftClose, Settings, Pencil, Trash2, X, Loader2
} from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { getChatHistory, deleteChat, renameChat } from "@/lib/actions";

function groupChatsByDate(chats) {
    const groups = { "Today": [], "Yesterday": [], "Previous 7 days": [], "Older": [] };
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today); lastWeek.setDate(lastWeek.getDate() - 7);

    chats.forEach(chat => {
        const chatDate = new Date(chat.updatedAt);
        if (chatDate >= today) groups["Today"].push(chat);
        else if (chatDate >= yesterday) groups["Yesterday"].push(chat);
        else if (chatDate >= lastWeek) groups["Previous 7 days"].push(chat);
        else groups["Older"].push(chat);
    });

    return Object.entries(groups)
        .filter(([_, chatList]) => chatList.length > 0)
        .map(([group, chatList]) => ({
            group,
            chats: chatList.map(c => ({ id: c._id, title: c.title }))
        }));
}

export default function Sidebar({ isOpen, onClose, onNewChat, activeChatId, onSelectChat, isCollapsed, onToggleCollapse, onOpenSettings, refreshTrigger, onChatDeleted }) {
    const [query, setQuery] = useState("");
    const { isLoaded, isSignedIn, user } = useUser();
    const [dbHistory, setDbHistory] = useState([]);
    const [isLoadingChats, setIsLoadingChats] = useState(true);

    // Editing & Deleting states
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState("");

    // JADOO: Custom Modal ke liye state
    const [chatToDelete, setChatToDelete] = useState(null);

    useEffect(() => {
        async function loadChats() {
            try {
                const chats = await getChatHistory();
                setDbHistory(groupChatsByDate(chats));
            } catch (error) {
                console.error("Failed to load history");
            } finally {
                setIsLoadingChats(false);
            }
        }
        if (isSignedIn) loadChats();
    }, [isSignedIn, refreshTrigger]);

    // Handle Confirm Delete (Modal Action)
    const executeDelete = async () => {
        if (!chatToDelete) return;

        const id = chatToDelete;
        setChatToDelete(null); // Modal foran band karo

        // UI se optimistically hatao
        setDbHistory(prev => prev.map(group => ({
            ...group,
            chats: group.chats.filter(c => c.id !== id)
        })).filter(group => group.chats.length > 0));

        // DB update karo
        await deleteChat(id);
        if (onChatDeleted) onChatDeleted(id);
    };

    const startRename = (e, chat) => {
        e.stopPropagation();
        setEditingId(chat.id);
        setEditValue(chat.title);
    };

    const saveRename = async (id) => {
        if (editValue.trim() === "") {
            setEditingId(null);
            return;
        }

        setDbHistory(prev => prev.map(group => ({
            ...group,
            chats: group.chats.map(c => c.id === id ? { ...c, title: editValue } : c)
        })));
        setEditingId(null);

        await renameChat(id, editValue);
    };

    const filtered = dbHistory.map((section) => ({
        ...section,
        chats: section.chats.filter((c) =>
            c.title.toLowerCase().includes(query.toLowerCase())
        ),
    })).filter((section) => section.chats.length > 0);

    return (
        <>
            {/* Mobile Sidebar Overlay */}
            {isOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onClose} />}

            {/* --- CUSTOM DELETE CONFIRMATION MODAL --- */}
            {chatToDelete && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-surface border border-border rounded-[24px] shadow-2xl w-full max-w-[320px] overflow-hidden animate-fade-up">
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 rounded-full bg-danger-soft text-danger flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={24} />
                            </div>
                            <h3 className="text-[17px] font-semibold text-ink mb-1.5">Delete chat?</h3>
                            <p className="text-[14px] text-ink-muted leading-relaxed">
                                This will permanently delete this conversation. You can't undo this action.
                            </p>
                        </div>
                        <div className="flex border-t border-border bg-surface-1">
                            <button
                                onClick={() => setChatToDelete(null)}
                                className="flex-1 py-3.5 text-[14.5px] font-medium text-ink-muted hover:text-ink hover:bg-surface-hover transition-colors border-r border-border"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeDelete}
                                className="flex-1 py-3.5 text-[14.5px] font-medium text-danger hover:bg-danger-soft transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <aside className={`fixed md:static inset-y-0 left-0 z-50 md:z-auto flex flex-col bg-surface-1 border-r border-border transition-all duration-300 ease-out ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} ${isCollapsed ? "md:w-[76px]" : "w-72"}`}>
                <div className="flex items-center gap-2 p-3">
                    <button onClick={onClose} className="md:hidden p-2 rounded-lg hover:bg-surface-hover text-gray-500 dark:text-gray-400 ml-auto order-2"><X size={18} /></button>
                    <button onClick={onToggleCollapse} className="hidden md:flex p-2.5 rounded-xl hover:bg-surface-hover text-gray-500 dark:text-gray-400 shrink-0">
                        <PanelLeftClose size={18} className={`transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`} />
                    </button>
                    {!isCollapsed && <span className="font-display font-semibold text-ink tracking-tight">{APP_NAME}</span>}
                </div>

                <div className="px-3">
                    <button onClick={onNewChat} className={`w-full flex items-center gap-3 rounded-xl border border-border bg-surface hover:bg-surface-hover transition-colors shadow-sm text-ink font-medium ${isCollapsed ? "justify-center p-3" : "px-4 py-2.5"}`}>
                        <Plus size={18} />
                        {!isCollapsed && <span className="text-[14.5px] tracking-[0.01em]">New chat</span>}
                    </button>
                </div>

                {!isCollapsed && (
                    <div className="px-3 mt-3">
                        <div className="relative">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search chats" className="w-full bg-surface border border-border rounded-lg pl-8 pr-3 py-2 text-[14px] font-medium tracking-[0.01em] text-ink placeholder-gray-500 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus:border-accent transition-colors" />
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto px-2 mt-3 pb-3">
                    {isLoadingChats ? (
                        <div className="flex justify-center items-center h-20 text-gray-500"><Loader2 size={20} className="animate-spin" /></div>
                    ) : !isCollapsed && filtered.length > 0 ? (
                        filtered.map((section) => (
                            <div key={section.group} className="mb-4">
                                <p className="text-[12px] font-semibold tracking-wide text-gray-500 dark:text-gray-400 px-3 mb-1.5 mt-1">{section.group}</p>
                                {section.chats.map((chat) => (
                                    <button
                                        key={chat.id}
                                        onClick={() => onSelectChat(chat.id)}
                                        className={`group w-full flex items-center gap-2.5 text-[14.5px] font-medium tracking-[0.01em] px-3 py-2.5 rounded-[10px] transition-colors text-left ${activeChatId === chat.id ? "bg-accent-soft text-accent" : "text-gray-600 dark:text-gray-300 hover:bg-surface-hover hover:text-gray-900 dark:hover:text-white"}`}
                                    >
                                        <MessageSquare size={16} className="shrink-0" />

                                        {editingId === chat.id ? (
                                            <input
                                                autoFocus
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                onBlur={() => saveRename(chat.id)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') saveRename(chat.id);
                                                    if (e.key === 'Escape') setEditingId(null);
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                className="flex-1 bg-surface border border-accent rounded px-1.5 py-0.5 text-[14px] outline-none text-ink w-full"
                                            />
                                        ) : (
                                            <span className="truncate flex-1">{chat.title}</span>
                                        )}

                                        {editingId !== chat.id && (
                                            <span className="hidden group-hover:flex items-center gap-1.5 shrink-0">
                                                <Pencil size={14} className="hover:text-ink transition-colors" onClick={(e) => startRename(e, chat)} />
                                                <Trash2
                                                    size={14}
                                                    className="hover:text-danger transition-colors"
                                                    // Jadoo: Ab click karne par custom modal open hoga
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setChatToDelete(chat.id);
                                                    }}
                                                />
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        ))
                    ) : !isCollapsed && filtered.length === 0 ? (
                        <div className="text-center text-[14.5px] font-medium text-gray-500 dark:text-gray-400 mt-4">{query ? "No results found" : "No chats yet"}</div>
                    ) : isCollapsed && (
                        dbHistory.flatMap((s) => s.chats).slice(0, 6).map((chat) => (
                            <button key={chat.id} onClick={() => onSelectChat(chat.id)} title={chat.title} className={`w-full flex justify-center p-2.5 rounded-[10px] mb-1 transition-colors ${activeChatId === chat.id ? "bg-accent-soft text-accent" : "text-gray-600 dark:text-gray-300 hover:bg-surface-hover hover:text-gray-900 dark:hover:text-white"}`}>
                                <MessageSquare size={16} />
                            </button>
                        ))
                    )}
                </div>

                <div className="border-t border-border p-3 flex items-center gap-2">
                    <div className={`${isCollapsed ? "mx-auto" : "shrink-0"} pt-1`}><UserButton afterSignOutUrl="/sign-in" /></div>
                    {!isCollapsed && (  
                        <button onClick={onOpenSettings} className="flex-1 flex items-center justify-between min-w-0 p-2 rounded-lg hover:bg-surface-hover transition-colors text-left">
                            <div className="min-w-0 pr-2">
                                <p className="text-[14px] text-ink font-semibold tracking-[0.01em] truncate">{isLoaded && isSignedIn ? user.fullName || user.username : "Loading..."}</p>
                                <p className="text-[12px] text-gray-500 dark:text-gray-400 font-medium truncate mt-0.5">Free plan</p>
                            </div>
                            <Settings size={16} className="text-gray-500 dark:text-gray-400 shrink-0" />
                        </button>
                    )}
                </div>
            </aside>
        </>
    );
}