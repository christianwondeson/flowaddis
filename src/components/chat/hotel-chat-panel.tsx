'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AdminLoader } from '@/components/ui/admin-loader';
import { useAuth } from '@/components/providers/auth-provider';
import {
    ensureGuestThread,
    ensureOpsThread,
    ensureSupportThread,
    listenGuestThreadsForUser,
    listenMessages,
    listenThreadDoc,
    listenThreadsByType,
    sendChatMessage,
    editChatMessage,
    deleteChatMessage,
    type ChatMessage,
    type ChatThread,
    type ChatThreadType,
} from '@/lib/hotel-chat';
import {
    MessageSquare,
    Send,
    Edit3,
    Trash2,
    Copy,
    Check,
    X,
    Search,
    Clock,
    User,
    Sparkles,
    Shield,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type Props = {
    hotelId: string;
    hotelName: string;
    /** ops = SA ↔ hotel desk; guest = guest↔hotel; support = guest↔BookAddis SA */
    mode: ChatThreadType;
    /** When guest opens chat from client side */
    guestSelf?: boolean;
};

const QUICK_REPLIES = [
    '👋 Hello! Welcome to our hotel. How may we assist your stay today?',
    '🚗 Your airport shuttle pickup is confirmed. Driver will wait at exit with your name.',
    '🕒 Standard check-in starts at 2:00 PM. Early check-in is subject to availability.',
    '🍳 Breakfast is served daily from 6:30 AM to 10:30 AM in the main dining room.',
    '📶 High-speed WiFi is complimentary across all rooms. Network details are in your room.',
];

function formatMessageTime(createdAt: unknown): string {
    if (!createdAt) return '';
    try {
        const seconds = (createdAt as { seconds?: number })?.seconds;
        const d = seconds ? new Date(seconds * 1000) : new Date(String(createdAt));
        if (Number.isNaN(d.getTime())) return '';
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
        return '';
    }
}

function formatRelativeDate(createdAt: unknown): string {
    if (!createdAt) return '';
    try {
        const seconds = (createdAt as { seconds?: number })?.seconds;
        const d = seconds ? new Date(seconds * 1000) : new Date(String(createdAt));
        if (Number.isNaN(d.getTime())) return '';
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        if (diffHours < 24 && now.getDate() === d.getDate()) {
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        if (diffHours < 48) return 'Yesterday';
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
        return '';
    }
}

export function HotelChatPanel({ hotelId, hotelName, mode, guestSelf }: Props) {
    const { user } = useAuth();
    const [threads, setThreads] = useState<ChatThread[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loadingThreads, setLoadingThreads] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [draft, setDraft] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filter & Search
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<'all' | 'guest' | 'ops'>('all');

    // Editing message state
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const bottomRef = useRef<HTMLDivElement | null>(null);

    const senderRole = useMemo(() => {
        if (!user) return 'user';
        if (user.role === 'admin') return 'super_admin';
        if (user.role === 'hotel_admin' || user.role === 'hotel_staff') {
            return 'hotel_admin';
        }
        return 'guest';
    }, [user]);

    useEffect(() => {
        if (!user?.id || !hotelId) return;
        let cancelled = false;
        let unsub: (() => void) | undefined;

        (async () => {
            setError(null);
            setLoadingThreads(true);
            try {
                if (mode === 'ops' && !guestSelf) {
                    await ensureOpsThread({
                        hotelId,
                        hotelName,
                        hotelAdminUid: user.id,
                        superAdminUid: user.role === 'admin' ? user.id : '',
                    });
                }
                if (guestSelf && mode === 'guest') {
                    await ensureGuestThread({
                        hotelId,
                        hotelName,
                        guestUid: user.id,
                        guestName: user.name || user.email || 'Guest',
                    });
                }
                if (guestSelf && mode === 'support') {
                    await ensureSupportThread({
                        hotelId,
                        hotelName,
                        guestUid: user.id,
                        guestName: user.name || user.email || 'Guest',
                    });
                }
            } catch (e) {
                if (!cancelled) setError((e as Error).message);
            }

            if (cancelled) return;

            const applyThreads = (rows: ChatThread[]) => {
                const filtered = guestSelf
                    ? rows.filter((t) =>
                          mode === 'support'
                              ? t.type === 'support'
                              : t.type === 'guest',
                      )
                    : rows;
                setThreads(filtered);
                setLoadingThreads(false);
                setActiveId((prev) => {
                    if (prev && filtered.some((t) => t.id === prev)) return prev;
                    return filtered[0]?.id ?? null;
                });
            };

            const onErr = (err: Error) => {
                setError(err.message);
                setLoadingThreads(false);
            };

            // Guests must query by guestUid — unfiltered list always fails rules.
            if (guestSelf) {
                unsub = listenGuestThreadsForUser(
                    hotelId,
                    user.id,
                    applyThreads,
                    onErr,
                );
                return;
            }

            // Ops: prefer single-doc listener (most reliable under rules).
            if (mode === 'ops') {
                unsub = listenThreadDoc(
                    hotelId,
                    'ops',
                    (thread) => {
                        applyThreads(thread ? [thread] : []);
                    },
                    onErr,
                );
                return;
            }

            // Desk/SA guest or support inboxes — type-filtered list.
            unsub = listenThreadsByType(hotelId, mode, applyThreads, onErr);
        })();

        return () => {
            cancelled = true;
            unsub?.();
        };
    }, [
        hotelId,
        hotelName,
        mode,
        guestSelf,
        user?.id,
        user?.role,
        user?.name,
        user?.email,
    ]);

    useEffect(() => {
        if (!hotelId || !activeId) {
            setMessages([]);
            return;
        }
        setLoadingMessages(true);
        const unsub = listenMessages(
            hotelId,
            activeId,
            (rows) => {
                setMessages(rows);
                setLoadingMessages(false);
            },
            (err) => {
                setError(err.message);
                setLoadingMessages(false);
            },
        );
        return () => unsub();
    }, [hotelId, activeId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length]);

    // Send or Save Edit
    const onSend = async () => {
        if (!user?.id || !activeId || !draft.trim()) return;
        setSending(true);
        setError(null);
        try {
            if (editingMessageId) {
                // Editing existing message
                await editChatMessage({
                    hotelId,
                    threadId: activeId,
                    messageId: editingMessageId,
                    body: draft,
                });
                toast.success('Message updated');
                setEditingMessageId(null);
            } else {
                // Sending new message
                await sendChatMessage({
                    hotelId,
                    threadId: activeId,
                    senderUid: user.id,
                    senderName: user.name || user.email || 'User',
                    senderRole,
                    body: draft,
                });
            }
            setDraft('');
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setSending(false);
        }
    };

    const handleStartEdit = (m: ChatMessage) => {
        setEditingMessageId(m.id);
        setDraft(m.body);
    };

    const handleCancelEdit = () => {
        setEditingMessageId(null);
        setDraft('');
    };

    const handleDelete = async (messageId: string) => {
        if (!activeId) return;
        if (!confirm('Are you sure you want to delete this message?')) return;
        try {
            await deleteChatMessage({
                hotelId,
                threadId: activeId,
                messageId,
            });
            toast.success('Message deleted');
        } catch (e) {
            toast.error((e as Error).message);
        }
    };

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
        toast.info('Copied to clipboard');
    };

    // Filter threads for searching and categorization
    const filteredThreads = useMemo(() => {
        return threads.filter((t) => {
            if (categoryFilter !== 'all' && t.type !== categoryFilter) return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchesTitle = t.title.toLowerCase().includes(q);
                const matchesSnippet = t.lastMessagePreview?.toLowerCase().includes(q);
                return matchesTitle || matchesSnippet;
            }
            return true;
        });
    }, [threads, categoryFilter, searchQuery]);

    const activeThread = useMemo(() => {
        return threads.find((t) => t.id === activeId) || null;
    }, [threads, activeId]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 min-h-[580px] h-[calc(100vh-210px)] max-h-[820px]">
            {/* Conversations Sidebar */}
            <aside className="rounded-2xl border border-slate-200 bg-white overflow-hidden flex flex-col shadow-xs">
                {/* Sidebar Header */}
                <div className="p-3.5 border-b border-slate-100 bg-slate-50/70 space-y-2.5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                {guestSelf
                                    ? 'Guest Inbox'
                                    : mode === 'ops'
                                      ? 'Operations Desk'
                                      : 'Guest Inquiries'}
                            </p>
                            <h2 className="text-sm font-extrabold text-brand-dark truncate">
                                {hotelName}
                            </h2>
                        </div>
                        <span className="rounded-md bg-teal-50 px-2 py-0.5 text-xs font-bold text-teal-800 border border-teal-200">
                            {filteredThreads.length}
                        </span>
                    </div>

                    {/* Search Conversations Input */}
                    <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search conversations…"
                            className="h-8 pl-8 pr-7 text-xs bg-white rounded-lg border-slate-200"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Category Filter Pills (if not guestSelf) */}
                    {!guestSelf && (
                        <div className="flex items-center gap-1 text-[11px] font-semibold pt-0.5">
                            <button
                                type="button"
                                onClick={() => setCategoryFilter('all')}
                                className={cn(
                                    'px-2 py-0.5 rounded-md transition-colors',
                                    categoryFilter === 'all'
                                        ? 'bg-brand-primary text-white font-bold'
                                        : 'text-slate-600 hover:bg-slate-200/60',
                                )}
                            >
                                All
                            </button>
                            <button
                                type="button"
                                onClick={() => setCategoryFilter('guest')}
                                className={cn(
                                    'px-2 py-0.5 rounded-md transition-colors',
                                    categoryFilter === 'guest'
                                        ? 'bg-brand-primary text-white font-bold'
                                        : 'text-slate-600 hover:bg-slate-200/60',
                                )}
                            >
                                Guests
                            </button>
                            <button
                                type="button"
                                onClick={() => setCategoryFilter('ops')}
                                className={cn(
                                    'px-2 py-0.5 rounded-md transition-colors',
                                    categoryFilter === 'ops'
                                        ? 'bg-brand-primary text-white font-bold'
                                        : 'text-slate-600 hover:bg-slate-200/60',
                                )}
                            >
                                Ops
                            </button>
                        </div>
                    )}
                </div>

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto">
                    {loadingThreads ? (
                        <AdminLoader
                            label="Loading chats…"
                            className="min-h-[140px] py-10"
                        />
                    ) : filteredThreads.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 space-y-2">
                            <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                            <p className="text-xs">
                                {searchQuery
                                    ? 'No conversations match your search.'
                                    : 'No conversations yet.'}
                            </p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {filteredThreads.map((t) => {
                                const isSelected = activeId === t.id;
                                const timeLabel = formatRelativeDate(t.lastMessageAt);

                                return (
                                    <li key={t.id}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setActiveId(t.id);
                                                handleCancelEdit();
                                            }}
                                            className={cn(
                                                'w-full text-left px-3.5 py-3 hover:bg-slate-50 transition-colors relative block',
                                                isSelected && 'bg-brand-primary/5 font-medium border-l-4 border-brand-primary',
                                            )}
                                        >
                                            <div className="flex items-center justify-between gap-1.5 mb-1">
                                                <div className="flex items-center gap-1.5 truncate">
                                                    <span className="h-6 w-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                                                        {t.title.slice(0, 1).toUpperCase()}
                                                    </span>
                                                    <span className="text-xs font-bold text-brand-dark truncate">
                                                        {t.title}
                                                    </span>
                                                </div>
                                                {timeLabel && (
                                                    <span className="text-[10px] text-slate-400 shrink-0">
                                                        {timeLabel}
                                                    </span>
                                                )}
                                            </div>

                                            {t.lastMessagePreview ? (
                                                <p className="text-[11px] text-slate-500 line-clamp-2 pl-7.5 leading-relaxed">
                                                    {t.lastMessagePreview}
                                                </p>
                                            ) : (
                                                <p className="text-[11px] text-slate-400 italic pl-7.5">
                                                    No messages yet
                                                </p>
                                            )}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </aside>

            {/* Chat Pane */}
            <section className="rounded-2xl border border-slate-200 bg-white flex flex-col overflow-hidden shadow-xs">
                {/* Active Conversation Header */}
                <div className="px-5 py-3.5 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-full bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center font-bold text-sm shrink-0">
                            {activeThread?.title ? activeThread.title.slice(0, 1).toUpperCase() : 'C'}
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-sm font-extrabold text-brand-dark truncate">
                                {activeThread ? activeThread.title : 'Conversation'}
                            </h3>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                                <span>Verified Guest Stay / Desk</span>
                                <span className="text-slate-300">·</span>
                                <span className="text-slate-400">Direct End-to-End Chat</span>
                            </div>
                        </div>
                    </div>

                    {activeThread && (
                        <div className="flex items-center gap-2 text-xs">
                            <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                                Type: {activeThread.type.toUpperCase()}
                            </span>
                        </div>
                    )}
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="m-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900 flex items-start gap-2 shrink-0">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold">{error}</p>
                            <p className="text-[11px] text-amber-800 mt-0.5">
                                If using an ad blocker, ensure Google Firestore APIs are not blocked.
                            </p>
                        </div>
                    </div>
                )}

                {/* Messages Scroll Area */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5 bg-slate-50/40">
                    {!activeId ? (
                        <div className="text-center py-24 space-y-3">
                            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto" />
                            <p className="text-sm font-semibold text-slate-600">
                                Select a conversation on the left to start messaging.
                            </p>
                        </div>
                    ) : loadingMessages ? (
                        <AdminLoader label="Loading messages…" className="py-20" />
                    ) : messages.length === 0 ? (
                        <div className="text-center py-20 space-y-2">
                            <p className="text-sm font-semibold text-slate-700">No messages yet</p>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                Say hello or send guest check-in details. Messages sync live across all staff and guest devices.
                            </p>
                        </div>
                    ) : (
                        messages.map((m) => {
                            const mine = m.senderUid === user?.id;
                            const timeStr = formatMessageTime(m.createdAt);

                            return (
                                <div
                                    key={m.id}
                                    className={cn(
                                        'flex group items-end gap-1.5',
                                        mine ? 'justify-end' : 'justify-start',
                                    )}
                                >
                                    {/* Action Buttons for Sender (Edit / Delete / Copy) */}
                                    {mine && !m.isDeleted && (
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-white border border-slate-200 shadow-2xs rounded-lg p-0.5 self-center">
                                            <button
                                                type="button"
                                                onClick={() => handleStartEdit(m)}
                                                className="p-1 text-slate-500 hover:text-brand-primary rounded hover:bg-slate-100"
                                                title="Edit message"
                                            >
                                                <Edit3 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleCopy(m.body, m.id)}
                                                className="p-1 text-slate-500 hover:text-slate-700 rounded hover:bg-slate-100"
                                                title="Copy message"
                                            >
                                                {copiedId === m.id ? (
                                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                ) : (
                                                    <Copy className="w-3.5 h-3.5" />
                                                )}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(m.id)}
                                                className="p-1 text-slate-500 hover:text-rose-600 rounded hover:bg-rose-50"
                                                title="Delete message"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}

                                    {/* Message Bubble */}
                                    <div
                                        className={cn(
                                            'max-w-[78%] rounded-2xl px-4 py-2.5 text-sm shadow-2xs space-y-1',
                                            mine
                                                ? 'bg-brand-primary text-white rounded-br-xs'
                                                : 'bg-white border border-slate-200 text-slate-900 rounded-bl-xs',
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                'flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-wider',
                                                mine ? 'text-teal-100' : 'text-slate-500',
                                            )}
                                        >
                                            <span>
                                                {m.senderName}
                                                {m.senderRole ? ` · ${m.senderRole.replace('_', ' ')}` : ''}
                                            </span>
                                            {timeStr && (
                                                <span className="font-normal opacity-80">
                                                    {timeStr}
                                                </span>
                                            )}
                                        </div>

                                        <p
                                            className={cn(
                                                'whitespace-pre-wrap leading-relaxed text-xs sm:text-sm break-words',
                                                m.isDeleted && 'italic opacity-60',
                                            )}
                                        >
                                            {m.body}
                                        </p>

                                        {m.isEdited && !m.isDeleted && (
                                            <p
                                                className={cn(
                                                    'text-[9px] text-right font-medium',
                                                    mine ? 'text-teal-200' : 'text-slate-400',
                                                )}
                                            >
                                                (edited)
                                            </p>
                                        )}
                                    </div>

                                    {/* Action button for receiver (Copy only) */}
                                    {!mine && !m.isDeleted && (
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center bg-white border border-slate-200 shadow-2xs rounded-lg p-0.5 self-center">
                                            <button
                                                type="button"
                                                onClick={() => handleCopy(m.body, m.id)}
                                                className="p-1 text-slate-500 hover:text-slate-700 rounded hover:bg-slate-100"
                                                title="Copy message"
                                            >
                                                {copiedId === m.id ? (
                                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                ) : (
                                                    <Copy className="w-3.5 h-3.5" />
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Quick Replies Strip */}
                <div className="px-4 py-2 border-t border-slate-100 bg-white overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
                    <span className="text-[11px] font-bold text-slate-400 shrink-0 inline-flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-brand-primary" />
                        Quick replies:
                    </span>
                    {QUICK_REPLIES.map((qr) => (
                        <button
                            key={qr}
                            type="button"
                            onClick={() => setDraft(qr)}
                            className="rounded-full bg-slate-100 hover:bg-slate-200/80 px-3 py-1 text-[11px] font-medium text-slate-700 shrink-0 transition-colors truncate max-w-xs"
                        >
                            {qr}
                        </button>
                    ))}
                </div>

                {/* Editing Notification Bar */}
                {editingMessageId && (
                    <div className="px-4 py-1.5 bg-amber-50 border-t border-amber-200 flex items-center justify-between text-xs text-amber-900 shrink-0">
                        <div className="flex items-center gap-2">
                            <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                            <span className="font-bold">Editing message</span>
                            <span className="text-amber-700 text-[11px]">
                                (Press Enter to save, or click Cancel)
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="text-amber-800 hover:text-amber-950 font-bold flex items-center gap-0.5"
                        >
                            <X className="w-3.5 h-3.5" />
                            <span>Cancel</span>
                        </button>
                    </div>
                )}

                {/* Input Area */}
                <div className="border-t border-slate-200 p-3 bg-white flex gap-2 shrink-0">
                    <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        rows={2}
                        placeholder={
                            activeId
                                ? editingMessageId
                                    ? 'Edit your message…'
                                    : 'Type your message (Enter to send, Shift+Enter for new line)…'
                                : 'Select a conversation first'
                        }
                        disabled={!activeId || sending}
                        className="flex-1 resize-none rounded-xl border border-slate-200 px-3.5 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                void onSend();
                            }
                        }}
                    />
                    <Button
                        type="button"
                        disabled={!activeId || sending || !draft.trim()}
                        onClick={() => void onSend()}
                        className="self-end bg-brand-primary text-white hover:bg-teal-700 font-bold px-4"
                    >
                        <Send className="w-4 h-4 mr-1" />
                        {editingMessageId ? 'Save' : 'Send'}
                    </Button>
                </div>
            </section>
        </div>
    );
}
