import { NextResponse } from 'next/server';
import { API_CONFIG, API_ENDPOINTS, getApiHeaders } from '@/lib/api-config';
import { useHotelbedsInventory, nestHotelbedsBackendUrl } from '@/lib/hotel-inventory';
import axios from 'axios';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get('hotelId');

    if (!hotelId) {
        return NextResponse.json({ error: 'Hotel ID is required' }, { status: 400 });
    }

    if (useHotelbedsInventory()) {
        const backendUrl = nestHotelbedsBackendUrl() || (process.env.BACKEND_URL || 'http://localhost:4000').replace(/\/$/, '');
        try {
            const res = await fetch(
                `${backendUrl}/api/v1/hotelbeds/content/reviews?hotelId=${encodeURIComponent(hotelId)}`,
                { headers: { Accept: 'application/json' }, next: { revalidate: 0 } },
            );
            const data = await res.json();
            if (!res.ok) {
                return NextResponse.json({ error: 'Failed to fetch reviews from backend' }, { status: res.status });
            }
            return NextResponse.json(data);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Unknown error';
            console.error('Hotelbeds reviews proxy:', msg);
            return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
        }
    }

    try {
        const options = {
            method: 'GET',
            url: `https://${API_CONFIG.RAPIDAPI_HOST}${API_ENDPOINTS.HOTELS.REVIEWS}`,
            params: {
                hotel_id: hotelId,
                locale: searchParams.get('locale') || 'en-gb',
                customer_type: searchParams.get('customer_type') || 'solo_traveller,review_category_group_of_friends',
                language_filter: searchParams.get('language_filter') || 'en-gb,de,fr',
                sort_type: searchParams.get('sort_type') || 'SORT_MOST_RELEVANT',
                page_number: searchParams.get('page_number') || '0',
            },
            headers: getApiHeaders(),
        };

        const response = await axios.request(options);
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('Error fetching hotel reviews:', error.message);
        return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }
}
