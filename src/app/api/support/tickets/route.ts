import { NextResponse } from 'next/server';
import type { CreateSupportTicketInput, SupportTicket } from '@/types/support';
import { verifyFirebaseIdToken } from '@/lib/verify-firebase-id-token';
import { getSafeBackendBaseUrl } from '@/lib/safe-backend-url';

declare global {
    // eslint-disable-next-line no-var
    var __supportTickets: SupportTicket[] | undefined;
}

const getStore = () => {
    if (!globalThis.__supportTickets) globalThis.__supportTickets = [];
    return globalThis.__supportTickets;
};

function nowIso() {
    return new Date().toISOString();
}

function makeId() {
    return `TCK-${Math.random().toString(16).slice(2, 8).toUpperCase()}-${Date.now().toString(16).toUpperCase()}`;
}

async function proxyToBackend(req: Request): Promise<{ res: Response | null; postBodyText?: string }> {
    let postBodyText: string | undefined;
    if (req.method === 'POST') {
        postBodyText = await req.text();
    }

    let backendUrl: string;
    try {
        backendUrl = getSafeBackendBaseUrl();
    } catch {
        return { res: null, postBodyText };
    }
    const url = new URL(`${backendUrl}/api/v1/support/tickets`);
    const authHeader = req.headers.get('Authorization');

    try {
        const res = await fetch(url.toString(), {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
                ...(authHeader && { Authorization: authHeader }),
            },
            body: req.method === 'POST' ? postBodyText : undefined,
        });
        if (res.status === 404) return { res: null, postBodyText };
        return { res, postBodyText };
    } catch {
        return { res: null, postBodyText };
    }
}

async function requireSignedIn(req: Request): Promise<NextResponse | null> {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    try {
        await verifyFirebaseIdToken(token);
    } catch {
        return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }
    return null;
}

export async function GET(req: Request) {
    try {
        const { res: proxied } = await proxyToBackend(req);
        if (proxied) {
            const data = await proxied.json();
            return NextResponse.json(data, { status: proxied.status });
        }

        return NextResponse.json(
            {
                error: 'Support service unavailable',
                message: 'Configure Nest support API and BACKEND_URL, or use the deployed backend.',
            },
            { status: 503 },
        );
    } catch (error) {
        console.error('Support tickets GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { res: proxied, postBodyText } = await proxyToBackend(req);
        if (proxied) {
            const data = await proxied.json();
            return NextResponse.json(data, { status: proxied.status });
        }

        const authErr = await requireSignedIn(req);
        if (authErr) return authErr;

        if (!postBodyText) {
            return NextResponse.json({ error: 'Empty body' }, { status: 400 });
        }
        let input: CreateSupportTicketInput;
        try {
            input = JSON.parse(postBodyText) as CreateSupportTicketInput;
        } catch {
            return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
        }

        const ticket: SupportTicket = {
            id: makeId(),
            createdAt: nowIso(),
            updatedAt: nowIso(),
            status: input.status ?? 'open',
            category: input.category,
            service: input.service,
            priority: input.priority,
            name: input.name,
            email: input.email,
            phone: input.phone,
            bookingId: input.bookingId,
            transactionId: input.transactionId,
            subject: input.subject,
            message: input.message,
        };

        const store = getStore();
        store.push(ticket);

        return NextResponse.json({ item: ticket }, { status: 201 });
    } catch (error) {
        console.error('Support tickets POST error:', error);
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}
