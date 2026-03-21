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

async function proxyToBackend(req: Request) {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
  const url = new URL(`${backendUrl}/api/v1/admin/support-tickets`);
  const { searchParams } = new URL(req.url);
  searchParams.forEach((value, key) => url.searchParams.append(key, value));

  const authHeader = req.headers.get('Authorization');
  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(authHeader && { Authorization: authHeader }),
    },
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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const q = (searchParams.get('q') || '').toLowerCase().trim();

    let items = getStore().slice().reverse();

    if (status && status !== 'all') items = items.filter((t) => t.status === status);
    if (q) {
      items = items.filter((t) => {
        const hay = [
          t.id,
          t.subject,
          t.message,
          t.email,
          t.name,
          t.bookingId || '',
          t.transactionId || '',
        ]
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      });
    }

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Admin support tickets GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

