'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AdminLoader } from '@/components/ui/admin-loader';
import { useAuth } from '@/components/providers/auth-provider';
import {
    ensureGuestThread,
    ensureOpsThread,
    ensureSupportThread,
    listenMessages,
    listenThreads,
    sendChatMessage,
    type ChatMessage,
    type ChatThread,
    type ChatThreadType,
} from '@/lib/hotel-chat';
import { MessageSquare, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
    hotelId: string;
    hotelName: string;
    /** ops = SA ↔ hotel desk; guest = guest↔hotel; support = guest↔BookAddis SA */
    mode: ChatThreadType;
    /** When guest opens chat from client side */
    guestSelf?: boolean;
};

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
    const bottomRef = useRef<HTMLDivElement | null>(null);

    const senderRole = useMemo(() => {
        if (!user) return 'user';
        if (user.role === 'admin') return 'super_admin';
        if (user.role === 'hotel_admin' || user.role === 'hotel_staff') return 'hotel_admin';
        return 'guest';
    }, [user]);

    useEffect(() => {
        if (!user?.id || !hotelId) return;
        let cancelled = false;

        (async () => {
            setError(null);
            try {
                if (mode === 'ops' && !guestSelf) {
                    // Always include the signed-in uid so rules + participants stay aligned.
                    await ensureOpsThread({
                        hotelId,
                        hotelName,
                        hotelAdminUid:
                            user.role === 'admin' ? user.id : user.id,
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
        })();

        setLoadingThreads(true);
        const unsub = listenThreads(
            hotelId,
            (rows) => {
                const filtered = guestSelf
                    ? rows.filter(
                          (t) =>
                              t.guestUid === user.id &&
                              (mode === 'support'
                                  ? t.type === 'support'
                                  : t.type === 'guest'),
                      )
                    : mode === 'ops'
                      ? rows.filter((t) => t.type === 'ops')
                      : mode === 'support'
                        ? rows.filter((t) => t.type === 'support')
                        : rows.filter((t) => t.type === 'guest');
                setThreads(filtered);
                setLoadingThreads(false);
                setActiveId((prev) => {
                    if (prev && filtered.some((t) => t.id === prev)) return prev;
                    return filtered[0]?.id ?? null;
                });
            },
            (err) => {
                setError(err.message);
                setLoadingThreads(false);
            },
        );

        return () => {
            cancelled = true;
            unsub();
        };
    }, [hotelId, hotelName, mode, guestSelf, user?.id, user?.role, user?.name, user?.email]);

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

    const onSend = async () => {
        if (!user?.id || !activeId || !draft.trim()) return;
        setSending(true);
        setError(null);
        try {
            await sendChatMessage({
                hotelId,
                threadId: activeId,
                senderUid: user.id,
                senderName: user.name || user.email || 'User',
                senderRole,
                body: draft,
            });
            setDraft('');
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 min-h-[480px]">
            <aside className="rounded-2xl border border-slate-200 bg-white overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        {guestSelf
                            ? 'Your chat'
                            : mode === 'ops'
                              ? 'Ops desk'
                              : 'Guest threads'}
                    </p>
                    <p className="text-sm font-semibold text-brand-dark truncate">{hotelName}</p>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {loadingThreads ? (
                        <AdminLoader label="Loading chats…" className="min-h-[120px] py-8" />
                    ) : threads.length === 0 ? (
                        <p className="p-4 text-sm text-slate-500">No conversations yet.</p>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {threads.map((t) => (
                                <li key={t.id}>
                                    <button
                                        type="button"
                                        onClick={() => setActiveId(t.id)}
                                        className={cn(
                                            'w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors',
                                            activeId === t.id && 'bg-brand-primary/5',
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <MessageSquare className="w-4 h-4 text-slate-400 shrink-0" />
                                            <span className="text-sm font-semibold text-brand-dark truncate">
                                                {t.title}
                                            </span>
                                        </div>
                                        {t.lastMessagePreview ? (
                                            <p className="mt-1 text-xs text-slate-500 line-clamp-2 pl-6">
                                                {t.lastMessagePreview}
                                            </p>
                                        ) : null}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </aside>

            <section className="rounded-2xl border border-slate-200 bg-white flex flex-col min-h-[480px]">
                {error ? (
                    <div className="m-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                        {error}
                        <p className="text-xs mt-1 text-amber-800">
                            If the console shows <code className="font-mono">ERR_BLOCKED_BY_CLIENT</code>,
                            disable your ad blocker / privacy extension for localhost (uBlock,
                            Brave Shields, etc.)  they block Firestore realtime channels. Also
                            allow authenticated read/write on{' '}
                            <code className="font-mono">hotelChats/**</code> in Firestore rules.
                        </p>
                    </div>
                ) : null}

                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                    {!activeId ? (
                        <p className="text-sm text-slate-500 text-center py-16">
                            Select a conversation to start messaging.
                        </p>
                    ) : loadingMessages ? (
                        <AdminLoader label="Loading messages…" />
                    ) : messages.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-16">
                            No messages yet  say hello.
                        </p>
                    ) : (
                        messages.map((m) => {
                            const mine = m.senderUid === user?.id;
                            return (
                                <div
                                    key={m.id}
                                    className={cn('flex', mine ? 'justify-end' : 'justify-start')}
                                >
                                    <div
                                        className={cn(
                                            'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm',
                                            mine
                                                ? 'bg-brand-dark text-white'
                                                : 'bg-slate-100 text-slate-800',
                                        )}
                                    >
                                        <p
                                            className={cn(
                                                'text-[10px] font-bold uppercase tracking-wide mb-0.5',
                                                mine ? 'text-white/70' : 'text-slate-500',
                                            )}
                                        >
                                            {m.senderName}
                                            {m.senderRole ? ` · ${m.senderRole}` : ''}
                                        </p>
                                        <p className="whitespace-pre-wrap">{m.body}</p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={bottomRef} />
                </div>

                <div className="border-t border-slate-100 p-3 flex gap-2">
                    <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        rows={2}
                        placeholder={
                            activeId
                                ? 'Type a message…'
                                : 'Select a thread first'
                        }
                        disabled={!activeId || sending}
                        className="flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
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
                        className="self-end"
                    >
                        <Send className="w-4 h-4" />
                        Send
                    </Button>
                </div>
            </section>
        </div>
    );
}
