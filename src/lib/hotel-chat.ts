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

function mapThread(
    hotelId: string,
    id: string,
    data: Record<string, unknown>,
): ChatThread {
    return {
        id,
        hotelId,
        hotelName: String(data.hotelName || ''),
        type: parseThreadType(data.type),
        title: String(data.title || id),
        participantUids: Array.isArray(data.participantUids)
            ? data.participantUids.map(String)
            : [],
        guestUid: data.guestUid ? String(data.guestUid) : null,
        lastMessageAt: data.lastMessageAt,
        lastMessagePreview: data.lastMessagePreview
            ? String(data.lastMessagePreview)
            : undefined,
    };
}

function firestoreChatError(err: unknown, fallback: string): Error {
    const msg = err instanceof Error ? err.message : String(err);
    if (/permission|insufficient/i.test(msg)) {
        return new Error(
            `${fallback} Your Firestore users/{uid}.role must be admin, hotel_admin, or hotel_staff, and firestore.rules must be deployed to the flowaddis-db database.`,
        );
    }
    if (/blocked|ERR_BLOCKED|Failed to fetch|unavailable|network/i.test(msg)) {
        return new Error(
            'Chat could not reach Firestore (network or browser extension). Try another browser profile or allow *.googleapis.com / *.firebaseio.com.',
        );
    }
    return err instanceof Error ? err : new Error(msg || fallback);
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
        throw firestoreChatError(
            e,
            'Cannot open ops chat.',
        );
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
    try {
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
    } catch (e) {
        throw firestoreChatError(e, 'Cannot open guest chat.');
    }
    return threadId;
}

/** Guest ↔ BookAddis Super Admin support. */
export async function ensureSupportThread(params: {
    hotelId: string;
    hotelName: string;
    guestUid: string;
    guestName: string;
}): Promise<string> {
    const threadId = `support_${params.guestUid}`;
    const ref = doc(threadsCol(params.hotelId), threadId);
    try {
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
    } catch (e) {
        throw firestoreChatError(e, 'Cannot open support chat.');
    }
    return threadId;
}

/**
 * Listen to a single known thread doc (avoids collection-list permission failures).
 */
export function listenThreadDoc(
    hotelId: string,
    threadId: string,
    onData: (thread: ChatThread | null) => void,
    onError?: (e: Error) => void,
): Unsubscribe {
    const ref = doc(threadsCol(hotelId), threadId);
    return onSnapshot(
        ref,
        (snap) => {
            if (!snap.exists()) {
                onData(null);
                return;
            }
            onData(mapThread(hotelId, snap.id, snap.data() as Record<string, unknown>));
        },
        (err) => onError?.(firestoreChatError(err, 'Cannot load conversation.')),
    );
}

/** Desk / SA: list threads of one type (query matches firestore.rules). */
export function listenThreadsByType(
    hotelId: string,
    type: ChatThreadType,
    onData: (threads: ChatThread[]) => void,
    onError?: (e: Error) => void,
): Unsubscribe {
    const q = query(threadsCol(hotelId), where('type', '==', type), limit(50));
    return onSnapshot(
        q,
        (snap) => {
            const rows: ChatThread[] = [];
            snap.forEach((d) => {
                rows.push(mapThread(hotelId, d.id, d.data() as Record<string, unknown>));
            });
            rows.sort((a, b) => {
                const ta =
                    (a.lastMessageAt as { seconds?: number } | undefined)?.seconds || 0;
                const tb =
                    (b.lastMessageAt as { seconds?: number } | undefined)?.seconds || 0;
                return tb - ta;
            });
            onData(rows);
        },
        (err) =>
            onError?.(
                firestoreChatError(
                    err,
                    'Chat list denied.',
                ),
            ),
    );
}

/** @deprecated Prefer listenThreadsByType or listenThreadDoc — unfiltered lists fail for guests. */
export function listenThreads(
    hotelId: string,
    onData: (threads: ChatThread[]) => void,
    onError?: (e: Error) => void,
): Unsubscribe {
    return listenThreadsByType(hotelId, 'ops', onData, onError);
}

export function listenMessages(
    hotelId: string,
    threadId: string,
    onData: (messages: ChatMessage[]) => void,
    onError?: (e: Error) => void,
): Unsubscribe {
    const q = query(
        messagesCol(hotelId, threadId),
        orderBy('createdAt', 'asc'),
        limit(200),
    );
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
        (err) =>
            onError?.(firestoreChatError(err, 'Cannot load messages.')),
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
        throw firestoreChatError(e, 'Message could not be sent.');
    }
}

/** Guest inbox: threads for this guest only (matches firestore.rules). */
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
                rows.push(mapThread(hotelId, d.id, d.data() as Record<string, unknown>));
            });
            onData(rows);
        },
        (err) =>
            onError?.(firestoreChatError(err, 'Cannot load your chats.')),
    );
}
