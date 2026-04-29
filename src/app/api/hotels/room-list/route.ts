import { NextResponse } from 'next/server';
import { API_CONFIG, API_ENDPOINTS, getApiHeaders } from '@/lib/api-config';
import { useHotelbedsInventory, logHotelInventoryRouting, nestHotelbedsBackendUrl } from '@/lib/hotel-inventory';
import axios from 'axios';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get('hotelId');
    const checkinDate = searchParams.get('checkin_date') || new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const checkoutDate = searchParams.get('checkout_date') || new Date(Date.now() + 172800000).toISOString().split('T')[0];
    const adults = searchParams.get('adults_number_by_rooms') || searchParams.get('adults_number') || '2';
    const children = searchParams.get('children_number_by_rooms') || searchParams.get('children_number') || '0';
    const childrenAges = searchParams.get('children_ages') || '';
    const currency = searchParams.get('currency') || 'USD';
    const rooms = searchParams.get('room_number') || '1';

    if (!hotelId) {
        return NextResponse.json({ error: 'hotelId is required' }, { status: 400 });
    }

    logHotelInventoryRouting('GET /api/hotels/room-list', {
        hotelId,
        checkinDate,
        checkoutDate,
        proxyToNest: useHotelbedsInventory(),
    });

    if (useHotelbedsInventory()) {
        const backendUrl = nestHotelbedsBackendUrl() || (process.env.BACKEND_URL || 'http://localhost:4000').replace(/\/$/, '');
        const hbParams = new URLSearchParams({
            hotelId,
            checkin_date: checkinDate,
            checkout_date: checkoutDate,
            adults_number: adults,
            children_number: children,
            room_number: rooms,
        });
        try {
            const res = await fetch(`${backendUrl}/api/v1/hotelbeds/room-list?${hbParams.toString()}`, {
                method: 'GET',
                headers: { Accept: 'application/json' },
                next: { revalidate: 0 },
            });
            const data = await res.json();
            if (!res.ok) {
                return NextResponse.json(
                    { error: data?.message || 'Hotelbeds room-list failed' },
                    { status: res.status },
                );
            }
            return NextResponse.json(data);
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Unknown error';
            console.error('Hotelbeds room-list proxy error:', msg);
            return NextResponse.json({ error: 'Failed to fetch room list from backend' }, { status: 500 });
        }
    }

    try {
        const options = {
            method: 'GET',
            url: `https://${API_CONFIG.RAPIDAPI_HOST}${API_ENDPOINTS.HOTELS.ROOM_LIST}`,
            params: {
                hotel_id: hotelId,
                checkin_date: checkinDate,
                checkout_date: checkoutDate,
                locale: 'en-gb',
                units: 'metric',
                adults_number_by_rooms: adults,
                currency: currency,
                ...(children !== '0' && { children_number_by_rooms: children }),
                ...(childrenAges && { children_ages: childrenAges }),
            },
            headers: getApiHeaders(),
        };

        const response = await axios.request(options);
        return NextResponse.json(response.data);
    } catch (error: unknown) {
        const err = error as { message?: string };
        console.error('Error fetching room list:', err.message);
        return NextResponse.json({ error: 'Failed to fetch room list' }, { status: 500 });
    }
}
