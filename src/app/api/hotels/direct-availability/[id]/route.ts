import { NextResponse } from 'next/server';
import { getSafeBackendBaseUrl } from '@/lib/safe-backend-url';

/**
 * Proxy Nest guest Direct/PMS availability:
 * GET /api/v1/hotels/:id/availability?checkIn=&checkOut=
 */
export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> | { id: string } },
) {
    try {
        const resolved = await Promise.resolve(context.params);
        const hotelId = resolved?.id;
        if (!hotelId) {
            return NextResponse.json({ error: 'Missing hotel id' }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const checkIn = searchParams.get('checkIn') || searchParams.get('checkin_date');
        const checkOut = searchParams.get('checkOut') || searchParams.get('checkout_date');
        if (!checkIn || !checkOut) {
            return NextResponse.json(
                { error: 'checkIn and checkOut are required (YYYY-MM-DD)' },
                { status: 400 },
            );
        }

        const backend = getSafeBackendBaseUrl();
        const qs = new URLSearchParams({ checkIn, checkOut });
        const res = await fetch(
            `${backend}/api/v1/hotels/${encodeURIComponent(hotelId)}/availability?${qs}`,
            { next: { revalidate: 15 } },
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            return NextResponse.json(
                { error: data?.message || data?.error || 'Availability unavailable' },
                { status: res.status },
            );
        }
        return NextResponse.json(data);
    } catch (e) {
        console.error('direct-availability', e);
        return NextResponse.json({ error: 'Availability proxy failed' }, { status: 502 });
    }
}
