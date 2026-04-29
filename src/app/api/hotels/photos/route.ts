import { NextResponse } from 'next/server';
import { API_CONFIG, API_ENDPOINTS, getApiHeaders } from '@/lib/api-config';
import { useHotelbedsInventory, nestHotelbedsBackendUrl, hotelbedsLanguageFromLocale } from '@/lib/hotel-inventory';
import axios from 'axios';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get('hotelId');

    if (!hotelId) {
        return NextResponse.json({ error: 'Hotel ID is required' }, { status: 400 });
    }

    if (useHotelbedsInventory()) {
        const backendUrl = nestHotelbedsBackendUrl() || (process.env.BACKEND_URL || 'http://localhost:4000').replace(/\/$/, '');
        const lang = hotelbedsLanguageFromLocale(searchParams.get('locale'));
        try {
            const res = await fetch(
                `${backendUrl}/api/v1/hotelbeds/content/photos?hotelId=${encodeURIComponent(hotelId)}&language=${encodeURIComponent(lang)}`,
                { headers: { Accept: 'application/json' }, next: { revalidate: 0 } },
            );
            const data = await res.json();
            if (!res.ok) {
                return NextResponse.json({ error: 'Failed to fetch photos from backend' }, { status: res.status });
            }
            return NextResponse.json(data);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Unknown error';
            console.error('Hotelbeds photos proxy:', msg);
            return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
        }
    }

    try {
        const options = {
            method: 'GET',
            url: `${API_CONFIG.BASE_URL}${API_ENDPOINTS.HOTELS.PHOTOS}`,
            params: {
                hotel_id: hotelId,
                locale: 'en-gb'
            },
            headers: getApiHeaders(),
        };

        const response = await axios.request(options);
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('Error fetching hotel photos:', error.message);
        return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
    }
}
