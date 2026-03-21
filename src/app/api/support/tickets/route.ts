import { NextResponse } from 'next/server';
import type { CreateSupportTicketInput, SupportTicket } from '@/types/support';

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

async function proxyToBackend(req: Request) {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
  const url = new URL(`${backendUrl}/api/v1/support/tickets`);
  const authHeader = req.headers.get('Authorization');

  const res = await fetch(url.toString(), {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      ...(authHeader && { Authorization: authHeader }),
    },
    body: req.method === 'POST' ? await req.text() : undefined,
  });

  if (res.status === 404) return null;
  return res;
}

export async function GET(req: Request) {
  try {
    const proxied = await proxyToBackend(req);
    if (proxied) {
      const data = await proxied.json();
      return NextResponse.json(data, { status: proxied.status });
    }

    const store = getStore();
    return NextResponse.json({ items: store.slice().reverse() });
  } catch (error) {
    console.error('Support tickets GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const proxied = await proxyToBackend(req);
    if (proxied) {
      const data = await proxied.json();
      return NextResponse.json(data, { status: proxied.status });
    }

    const input = (await req.json()) as CreateSupportTicketInput;

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

