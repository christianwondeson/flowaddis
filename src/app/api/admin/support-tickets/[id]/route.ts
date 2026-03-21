import { NextResponse } from 'next/server';
import type { SupportTicket } from '@/types/support';

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

async function proxyToBackend(req: Request, id: string) {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
  const url = new URL(`${backendUrl}/api/v1/admin/support-tickets/${encodeURIComponent(id)}`);
  const authHeader = req.headers.get('Authorization');

  const res = await fetch(url.toString(), {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      ...(authHeader && { Authorization: authHeader }),
    },
    body: req.method === 'PATCH' ? await req.text() : undefined,
  });

  if (res.status === 404) return null;
  return res;
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;

    const proxied = await proxyToBackend(req, id);
    if (proxied) {
      const data = await proxied.json();
      return NextResponse.json(data, { status: proxied.status });
    }

    const patch = (await req.json()) as Partial<
      Pick<SupportTicket, 'status' | 'priority' | 'assignedTo' | 'internalNote' | 'resolution'>
    >;

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

