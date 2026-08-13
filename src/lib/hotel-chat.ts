import {
    addDoc,
    collection,
    doc,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where,
    type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type ChatThreadType = 'ops' | 'guest' | 'support';

export type ChatThread = {
    id: string;
    hotelId: string;
    hotelName: string;
    type: ChatThreadType;
    title: string;
    participantUids: string[];
    guestUid?: string | null;
    lastMessageAt?: unknown;
    lastMessagePreview?: string;
};

function parseThreadType(raw: unknown): ChatThreadType {
    if (raw === 'guest' || raw === 'support' || raw === 'ops') return raw;
    return 'ops';
}

export type ChatMessage = {
    id: string;
    senderUid: string;
    senderName: string;
    senderRole: string;
    body: string;
    createdAt?: unknown;
};

function threadsCol(hotelId: string) {
    if (!db) throw new Error('Database not ready');
    return collection(db, 'hotelChats', hotelId, 'threads');
}

function messagesCol(hotelId: string, threadId: string) {
    if (!db) throw new Error('Database not ready');
    return collection(db, 'hotelChats', hotelId, 'threads', threadId, 'messages');
}

/** Ensure an ops thread exists for Super Admin ↔ hotel desk. */
export async function ensureOpsThread(params: {
    hotelId: string;
    hotelName: string;
    hotelAdminUid: string;
    superAdminUid: string;
}): Promise<string> {
    const threadId = 'ops';
    const ref = doc(threadsCol(params.hotelId), threadId);
    const participants = Array.from(
        new Set([params.hotelAdminUid, params.superAdminUid].filter(Boolean)),
    );
    try {
        await setDoc(
            ref,
            {
                hotelId: params.hotelId,
                hotelName: params.hotelName,
                type: 'ops' as ChatThreadType,
                title: `${params.hotelName} · BookAddis ops`,
                participantUids: participants,
                updatedAt: serverTimestamp(),
            },
            { merge: true },
        );
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (/permission|insufficient/i.test(msg)) {
            throw new Error(
                'Cannot open ops chat. Your Firestore users/{uid}.role must be hotel_admin or hotel_staff (set when Super Admin assigns hotel membership). Also deploy the latest firestore.rules.',
            );
        }
        throw e;
    }
    return threadId;
}

/** Guest ↔ hotel desk thread (one per guest per hotel). */
export async function ensureGuestThread(params: {
    hotelId: string;
    hotelName: string;
    guestUid: string;
    guestName: string;
    hotelStaffUids?: string[];
}): Promise<string> {
    const threadId = `guest_${params.guestUid}`;
    const ref = doc(threadsCol(params.hotelId), threadId);
    await setDoc(
        ref,
        {
            hotelId: params.hotelId,
            hotelName: params.hotelName,
            type: 'guest' as ChatThreadType,
            title: `${params.guestName} · ${params.hotelName}`,
            guestUid: params.guestUid,
            participantUids: Array.from(
                new Set([params.guestUid, ...(params.hotelStaffUids || [])]),
            ),
            updatedAt: serverTimestamp(),
        },
        { merge: true },
    );
    return threadId;
}

/** Guest ↔ BookAddis Super Admin support (same hotel context for reservation help). */
export async function ensureSupportThread(params: {
    hotelId: string;
    hotelName: string;
    guestUid: string;
    guestName: string;
}): Promise<string> {
    const threadId = `support_${params.guestUid}`;
    const ref = doc(threadsCol(params.hotelId), threadId);
    await setDoc(
        ref,
        {
            hotelId: params.hotelId,
            hotelName: params.hotelName,
            type: 'support' as ChatThreadType,
            title: `${params.guestName} · BookAddis support`,
            guestUid: params.guestUid,
            participantUids: [params.guestUid],
            updatedAt: serverTimestamp(),
        },
        { merge: true },
    );
    return threadId;
}

export function listenThreads(
    hotelId: string,
    onData: (threads: ChatThread[]) => void,
    onError?: (e: Error) => void,
): Unsubscribe {
    // No orderBy  avoids composite-index + permission failures when updatedAt
    // is missing; sort client-side instead.
    const q = query(threadsCol(hotelId), limit(50));
    return onSnapshot(
        q,
        (snap) => {
            const rows: ChatThread[] = [];
            snap.forEach((d) => {
                const data = d.data();
                rows.push({
                    id: d.id,
                    hotelId,
                    hotelName: String(data.hotelName || ''),
                    type: parseThreadType(data.type),
                    title: String(data.title || d.id),
                    participantUids: Array.isArray(data.participantUids)
                        ? data.participantUids.map(String)
                        : [],
                    guestUid: data.guestUid ? String(data.guestUid) : null,
                    lastMessageAt: data.lastMessageAt,
                    lastMessagePreview: data.lastMessagePreview
                        ? String(data.lastMessagePreview)
                        : undefined,
                });
            });
            rows.sort((a, b) => {
                const ta = (a.lastMessageAt as { seconds?: number } | undefined)?.seconds || 0;
                const tb = (b.lastMessageAt as { seconds?: number } | undefined)?.seconds || 0;
                return tb - ta;
            });
            onData(rows);
        },
        (err) => {
            const msg = (err as Error).message || String(err);
            if (/permission|insufficient/i.test(msg)) {
                onError?.(
                    new Error(
                        'Chat permissions denied. Deploy firestore.rules, ensure users/{uid}.role is hotel_admin or hotel_staff (assigned with hotel membership), and disable ad blockers on localhost.',
                    ),
                );
                return;
            }
            onError?.(err as Error);
        },
    );
}

export function listenMessages(
    hotelId: string,
    threadId: string,
    onData: (messages: ChatMessage[]) => void,
    onError?: (e: Error) => void,
): Unsubscribe {
    const q = query(messagesCol(hotelId, threadId), orderBy('createdAt', 'asc'), limit(200));
    return onSnapshot(
        q,
        (snap) => {
            const rows: ChatMessage[] = [];
            snap.forEach((d) => {
                const data = d.data();
                rows.push({
                    id: d.id,
                    senderUid: String(data.senderUid || ''),
                    senderName: String(data.senderName || 'User'),
                    senderRole: String(data.senderRole || 'user'),
                    body: String(data.body || ''),
                    createdAt: data.createdAt,
                });
            });
            onData(rows);
        },
        (err) => onError?.(err as Error),
    );
}

export async function sendChatMessage(params: {
    hotelId: string;
    threadId: string;
    senderUid: string;
    senderName: string;
    senderRole: string;
    body: string;
}): Promise<void> {
    const text = params.body.trim();
    if (!text) return;
    try {
        await addDoc(messagesCol(params.hotelId, params.threadId), {
            senderUid: params.senderUid,
            senderName: params.senderName,
            senderRole: params.senderRole,
            body: text,
            createdAt: serverTimestamp(),
        });
        await updateDoc(doc(threadsCol(params.hotelId), params.threadId), {
            lastMessageAt: serverTimestamp(),
            lastMessagePreview: text.slice(0, 140),
            updatedAt: serverTimestamp(),
        });
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (/blocked|network|Failed to fetch|unavailable/i.test(msg)) {
            throw new Error(
                'Chat blocked by the browser or network. Disable ad blockers for localhost, then retry.',
            );
        }
        throw e;
    }
}

/** Threads where the user participates (guest inbox). Requires composite index if filtered  keep simple. */
export function listenGuestThreadsForUser(
    hotelId: string,
    guestUid: string,
    onData: (threads: ChatThread[]) => void,
    onError?: (e: Error) => void,
): Unsubscribe {
    const q = query(
        threadsCol(hotelId),
        where('guestUid', '==', guestUid),
        limit(20),
    );
    return onSnapshot(
        q,
        (snap) => {
            const rows: ChatThread[] = [];
            snap.forEach((d) => {
                const data = d.data();
                rows.push({
                    id: d.id,
                    hotelId,
                    hotelName: String(data.hotelName || ''),
                    type: 'guest',
                    title: String(data.title || d.id),
                    participantUids: Array.isArray(data.participantUids)
                        ? data.participantUids.map(String)
                        : [],
                    guestUid,
                    lastMessagePreview: data.lastMessagePreview
                        ? String(data.lastMessagePreview)
                        : undefined,
                });
            });
            onData(rows);
        },
        (err) => onError?.(err as Error),
    );
}
