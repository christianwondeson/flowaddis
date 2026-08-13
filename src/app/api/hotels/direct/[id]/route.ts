import { NextResponse } from 'next/server';
import { getSafeBackendBaseUrl } from '@/lib/safe-backend-url';

/** Proxy Nest GET /api/v1/hotels/:id (published Direct / PMS hotel). */
export async function GET(
    _request: Request,
    context: { params: Promise<{ id: string }> | { id: string } },
) {
    try {
        const resolved = await Promise.resolve(context.params);
        const hotelId = resolved?.id;
        if (!hotelId) {
            return NextResponse.json({ error: 'Missing hotel id' }, { status: 400 });
        }
        const backend = getSafeBackendBaseUrl();
        const res = await fetch(
            `${backend}/api/v1/hotels/${encodeURIComponent(hotelId)}`,
            { next: { revalidate: 30 } },
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            return NextResponse.json(
                { error: data?.message || data?.error || 'Hotel not found' },
                { status: res.status },
            );
        }
        return NextResponse.json(data);
    } catch (e) {
        console.error('direct hotel detail', e);
        return NextResponse.json({ error: 'Hotel detail proxy failed' }, { status: 502 });
    }
}
