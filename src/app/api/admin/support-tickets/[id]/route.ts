import { NextResponse } from 'next/server';
import type { SupportTicket } from '@/types/support';
import { assertFirebaseAndNestAdmin, CmsAuthError } from '@/lib/assert-admin-cms';
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

async function readPatchBody(req: Request): Promise<string> {
    return req.text();
}

async function proxyToBackend(req: Request, id: string, patchBody: string): Promise<Response | null> {
    let backendUrl: string;
    try {
        backendUrl = getSafeBackendBaseUrl();
    } catch {
        return null;
    }
    const url = new URL(`${backendUrl}/api/v1/admin/support-tickets/${encodeURIComponent(id)}`);
    const authHeader = req.headers.get('Authorization');

    try {
        const res = await fetch(url.toString(), {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
                ...(authHeader && { Authorization: authHeader }),
            },
            body: req.method === 'PATCH' ? patchBody : undefined,
        });

        if (res.status === 404) return null;
        return res;
    } catch {
        return null;
    }
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await ctx.params;
        const patchBody = await readPatchBody(req);

        const proxied = await proxyToBackend(req, id, patchBody);
        if (proxied) {
            const data = await proxied.json();
            return NextResponse.json(data, { status: proxied.status });
        }

        try {
            await assertFirebaseAndNestAdmin(req);
        } catch (e) {
            if (e instanceof CmsAuthError) {
                return NextResponse.json({ error: e.message }, { status: e.status });
            }
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let patch: Partial<
            Pick<SupportTicket, 'status' | 'priority' | 'assignedTo' | 'internalNote' | 'resolution'>
        >;
        try {
            patch = JSON.parse(patchBody) as Partial<
                Pick<SupportTicket, 'status' | 'priority' | 'assignedTo' | 'internalNote' | 'resolution'>
            >;
        } catch {
            return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
        }

        const store = getStore();
        const idx = store.findIndex((t) => t.id === id);
        if (idx < 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const next: SupportTicket = {
            ...store[idx],
            ...patch,
            updatedAt: nowIso(),
        };
        store[idx] = next;

        return NextResponse.json({ item: next });
    } catch (error) {
        console.error('Admin support ticket PATCH error:', error);
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}
